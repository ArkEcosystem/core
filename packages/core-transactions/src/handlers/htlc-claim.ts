import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { expirationCalculator } from "@arkecosystem/core-utils";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert = require("assert");
import { HtlcLockExpiredError, HtlcLockTransactionNotFoundError, HtlcSecretHashMismatchError } from "../errors";
import { IDynamicFeeContext } from "../interfaces";
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
        const transactions = await connection.transactionsRepository.getClaimedHtlcLocks();

        for (const transaction of transactions) {
            const claimWallet: State.IWallet = walletManager.findByAddress(transaction.recipientId);
            claimWallet.balance = claimWallet.balance.plus(transaction.amount);
        }
    }

    public async isActivated(): Promise<boolean> {
        const milestone = Managers.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true;
    }

    public dynamicFee(context: IDynamicFeeContext): Utils.BigNumber {
        // override dynamicFee calculation as this is a zero-fee transaction
        return Utils.BigNumber.ZERO;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await this.performGenericWalletChecks(transaction, sender, walletManager);

        // Specific HTLC claim checks
        const claimAsset: Interfaces.IHtlcClaimAsset = transaction.data.asset.claim;
        const lockId: string = claimAsset.lockTransactionId;

        const dbWalletManager: State.IWalletManager = app.resolvePlugin<Database.IDatabaseService>("database")
            .walletManager;

        const lockWallet: State.IWallet = dbWalletManager.findByIndex(State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            throw new HtlcLockTransactionNotFoundError();
        }

        const lock: Interfaces.IHtlcLock = lockWallet.getAttribute("htlc.locks")[lockId];
        if (expirationCalculator.calculateLockExpirationStatus(lock.expiration)) {
            throw new HtlcLockExpiredError();
        }

        const unlockSecretBytes = Buffer.from(claimAsset.unlockSecret, "hex");
        const unlockSecretHash: string = Crypto.HashAlgorithms.sha256(unlockSecretBytes).toString("hex");
        if (lock.secretHash !== unlockSecretHash) {
            throw new HtlcSecretHashMismatchError();
        }
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string, message: string } | null> {
        const lockId: string = data.asset.claim.lockTransactionId;

        const databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");
        const lockWallet: State.IWallet = databaseService.walletManager.findByIndex(State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            return {
                type: "ERR_HTLCLOCKNOTFOUND",
                message: `The associated lock transaction id "${lockId}" was not found.`,
            };
        }

        const htlcClaimsInPool: Interfaces.ITransactionData[] = Array.from(
            await pool.getTransactionsByType(Enums.TransactionType.HtlcClaim),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        const alreadyHasPendingClaim: boolean = htlcClaimsInPool.some(
            transaction => transaction.asset.claim.lockTransactionId === lockId,
        );

        if (alreadyHasPendingClaim) {
            return {
                type: "ERR_PENDING",
                message: `HtlcClaim for "${lockId}" already in the pool`,
            };
        }

        return null;
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

        sender.verifyTransactionNonceApply(transaction);

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

        const newLockedBalance: Utils.BigNumber = lockedBalance.minus(locks[lockId].amount);
        assert(!newLockedBalance.isNegative());

        lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);

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

        sender.verifyTransactionNonceRevert(transaction);

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
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks");
        locks[lockTransaction.id] = {
            amount: lockTransaction.amount,
            recipientId: lockTransaction.recipientId,
            timestamp: lockTransaction.timestamp,
            vendorField: lockTransaction.vendorField
                ? Buffer.from(lockTransaction.vendorField, "hex").toString("utf8")
                : undefined,
            ...lockTransaction.asset.lock,
        };

        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
        walletManager.reindex(recipientWallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> { }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> { }
}
