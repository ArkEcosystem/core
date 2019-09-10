import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert = require("assert");
import {
    HtlcLockExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcSecretHashMismatchError,
    UnexpectedNonceError,
} from "../errors";
import { HtlcLockTransactionHandler } from "./htlc-lock";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

export class HtlcClaimTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.HtlcClaimTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [HtlcLockTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const lockId: string = transaction.asset.claim.lockTransactionId;
            const lockWallet: State.IWallet = walletManager.findByIndex(State.WalletIndexes.Locks, lockId);
            const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks");
            const claimWallet: State.IWallet = walletManager.findByAddress(locks[lockId].recipientId);
            claimWallet.balance = claimWallet.balance.plus(locks[lockId].amount);

            const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");
            lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.minus(locks[lockId].amount));
            delete locks[lockId];

            walletManager.reindex(lockWallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public dynamicFee(
        transaction: Interfaces.ITransaction,
        addonBytes: number,
        satoshiPerByte: number,
    ): Utils.BigNumber {
        // override dynamicFee calculation as this is a zero-fee transaction
        return Utils.BigNumber.ZERO;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): Promise<void> {
        await this.performGenericWalletChecks(transaction, sender, databaseWalletManager);

        // Specific HTLC claim checks
        const claimAsset: Interfaces.IHtlcClaimAsset = transaction.data.asset.claim;
        const lockId: string = claimAsset.lockTransactionId;
        const lockWallet: State.IWallet = databaseWalletManager.findByIndex(State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            throw new HtlcLockTransactionNotFoundError();
        }

        const lock: Interfaces.IHtlcLock = lockWallet.getAttribute("htlc.locks")[lockId];
        const lastBlock: Interfaces.IBlock = app
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .getLastBlock();

        const expiration: Interfaces.IHtlcExpiration = lock.asset.expiration;
        if (
            (expiration.type === Enums.HtlcLockExpirationType.EpochTimestamp &&
                expiration.value <= lastBlock.data.timestamp) ||
            (expiration.type === Enums.HtlcLockExpirationType.BlockHeight && expiration.value <= lastBlock.data.height)
        ) {
            throw new HtlcLockExpiredError();
        }

        const unlockSecretHash: string = Crypto.HashAlgorithms.sha256(claimAsset.unlockSecret).toString("hex");
        if (lock.asset.secretHash !== unlockSecretHash) {
            throw new HtlcSecretHashMismatchError();
        }
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        const lockId: string = data.asset.claim.lockTransactionId;
        const lockWallet: State.IWallet = pool.walletManager.findByIndex(State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            processor.pushError(
                data,
                "ERR_HTLCLOCKNOTFOUND",
                `The associated lock transaction id "${lockId}" was not found.`,
            );
            return false;
        }

        const htlcClaimsInPool: Interfaces.ITransactionData[] = Array.from(
            await pool.getTransactionsByType(Enums.TransactionType.HtlcClaim),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        const alreadyHasPendingClaim: boolean = htlcClaimsInPool.some(
            transaction => transaction.asset.claim.lockTransactionId === lockId,
        );

        if (alreadyHasPendingClaim) {
            processor.pushError(data, "ERR_PENDING", `HtlcClaim for "${lockId}" already in the pool`);
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            walletManager.logger.warn(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }

        await this.throwIfCannotBeApplied(transaction, sender, walletManager);

        if (!sender.nonce.plus(1).isEqualTo(data.nonce)) {
            throw new UnexpectedNonceError(data.nonce, sender.nonce, false);
        }

        sender.nonce = data.nonce;

        const lockId: string = data.asset.claim.lockTransactionId;
        const lockWallet: State.IWallet = walletManager.findByIndex(State.WalletIndexes.Locks, lockId);
        assert(lockWallet && lockWallet.getAttribute("htlc.locks")[lockId]);

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks");
        const recipientWallet: State.IWallet = walletManager.findByAddress(locks[lockId].recipientId);

        const newBalance: Utils.BigNumber = recipientWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        assert(!newBalance.isNegative());

        recipientWallet.balance = newBalance;
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.minus(locks[lockId].amount));
        delete locks[lockId];

        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
        walletManager.reindex(recipientWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (!sender.nonce.isEqualTo(data.nonce)) {
            throw new UnexpectedNonceError(data.nonce, sender.nonce, true);
        }

        sender.nonce = sender.nonce.minus(1);

        // TODO: not so good to call database from here, would need a better way
        const databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

        const lockId: string = data.asset.claim.lockTransactionId;
        const lockTransaction: Interfaces.ITransactionData = await databaseService.transactionsBusinessRepository.findById(
            lockId,
        );
        const lockWallet: State.IWallet = walletManager.findByPublicKey(lockTransaction.senderPublicKey);
        const recipientWallet: State.IWallet = walletManager.findByAddress(lockTransaction.recipientId);

        recipientWallet.balance = recipientWallet.balance.minus(lockTransaction.amount).plus(data.fee);
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks");
        locks[lockTransaction.id] = {
            amount: lockTransaction.amount,
            recipientId: lockTransaction.recipientId,
            asset: lockTransaction.asset.lock,
        };

        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
        walletManager.reindex(recipientWallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}
}
