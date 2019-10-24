import { app, Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { strict } from "assert";

import { HtlcLockExpiredError, HtlcLockTransactionNotFoundError, HtlcSecretHashMismatchError } from "../errors";
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

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getClaimedHtlcLocks();

        for (const transaction of transactions) {
            const claimWallet: Contracts.State.Wallet = walletRepository.findByAddress(transaction.recipientId);

            claimWallet.balance = claimWallet.balance.plus(transaction.amount);
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
        sender: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await this.performGenericWalletChecks(transaction, sender, databaseWalletRepository);

        // Specific HTLC claim checks
        const claimAsset: Interfaces.IHtlcClaimAsset = AppUtils.assert.defined(transaction.data.asset!.claim);
        const lockId: string = claimAsset.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = databaseWalletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new HtlcLockTransactionNotFoundError();
        }

        const lock: Interfaces.IHtlcLock = lockWallet.getAttribute("htlc.locks", {})[lockId];
        const lastBlock: Interfaces.IBlock = AppUtils.assert.defined(
            app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).getLastBlock(),
        );

        const expiration: Interfaces.IHtlcExpiration = lock.expiration;
        if (
            (expiration.type === Enums.HtlcLockExpirationType.EpochTimestamp &&
                expiration.value <= lastBlock.data.timestamp) ||
            (expiration.type === Enums.HtlcLockExpirationType.BlockHeight && expiration.value <= lastBlock.data.height)
        ) {
            throw new HtlcLockExpiredError();
        }

        const unlockSecretHash: string = Crypto.HashAlgorithms.sha256(claimAsset.unlockSecret).toString("hex");
        if (lock.secretHash !== unlockSecretHash) {
            throw new HtlcSecretHashMismatchError();
        }
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        const lockId: string = AppUtils.assert.defined(data.asset!.claim!.lockTransactionId);

        const databaseService: Contracts.Database.DatabaseService = app.get<Contracts.Database.DatabaseService>(
            Container.Identifiers.DatabaseService,
        );
        const lockWallet: Contracts.State.Wallet = databaseService.walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
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

        const alreadyHasPendingClaim: boolean = htlcClaimsInPool.some(transaction => {
            return AppUtils.assert.defined<string>(transaction.asset!.claim!.lockTransactionId) === lockId;
        });

        if (alreadyHasPendingClaim) {
            processor.pushError(data, "ERR_PENDING", `HtlcClaim for "${lockId}" already in the pool`);
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            AppUtils.assert.defined(transaction.data.senderPublicKey),
        );

        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data.id)) {
            app.log.warning(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }

        await this.throwIfCannotBeApplied(transaction, sender, walletRepository);

        sender.verifyTransactionNonceApply(transaction);

        sender.nonce = AppUtils.assert.defined(data.nonce);

        const lockId: string = AppUtils.assert.defined(data.asset!.claim!.lockTransactionId);
        const lockWallet: Contracts.State.Wallet = walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );

        strict(lockWallet && lockWallet.getAttribute("htlc.locks")[lockId]);

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks", {});

        const recipientId: string = AppUtils.assert.defined(locks[lockId].recipientId);

        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(
            AppUtils.assert.defined(recipientId),
        );

        const newBalance: Utils.BigNumber = recipientWallet.balance.plus(locks[lockId].amount).minus(data.fee);

        recipientWallet.balance = newBalance;
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");
        const newLockedBalance: Utils.BigNumber = lockedBalance.minus(locks[lockId].amount);

        strict(!newLockedBalance.isNegative());

        if (newLockedBalance.isZero()) {
            lockWallet.forgetAttribute("htlc.lockedBalance");
        } else {
            lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);
        }

        delete locks[lockId];

        walletRepository.reindex(sender);
        walletRepository.reindex(lockWallet);
        walletRepository.reindex(recipientWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const sender: Contracts.State.Wallet = AppUtils.assert.defined(transaction.data.senderPublicKey);

        const data: Interfaces.ITransactionData = transaction.data;

        sender.verifyTransactionNonceRevert(transaction);

        sender.nonce = sender.nonce.minus(1);

        // TODO: not so good to call database from here, would need a better way
        const databaseService: Contracts.Database.DatabaseService = app.get<Contracts.Database.DatabaseService>(
            Container.Identifiers.DatabaseService,
        );

        const lockId: string = AppUtils.assert.defined(data.asset!.claim!.lockTransactionId);
        const lockTransaction: Interfaces.ITransactionData = AppUtils.assert.defined(
            await databaseService.transactionsBusinessRepository.findById(lockId),
        );

        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(
            AppUtils.assert.defined(lockTransaction.recipientId),
        );
        recipientWallet.balance = recipientWallet.balance.minus(lockTransaction.amount).plus(data.fee);

        const lockWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(
            AppUtils.assert.defined(lockTransaction.senderPublicKey),
        );
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks");
        locks[lockTransaction.id!] = {
            amount: lockTransaction.amount,
            recipientId: lockTransaction.recipientId,
            timestamp: lockTransaction.timestamp,
            vendorField: lockTransaction.vendorField,
            ...AppUtils.assert.defined(lockTransaction.asset!.lock),
        };

        walletRepository.reindex(sender);
        walletRepository.reindex(lockWallet);
        walletRepository.reindex(recipientWallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {}
}
