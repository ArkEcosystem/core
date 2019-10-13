import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";

import { HtlcLockNotExpiredError, HtlcLockTransactionNotFoundError } from "../errors";
import { HtlcLockTransactionHandler } from "./htlc-lock";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

export class HtlcRefundTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.HtlcRefundTransaction;
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
        const transactions = await connection.transactionsRepository.getRefundedHtlcLocks();

        for (const transaction of transactions) {
            const refundWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey); // sender is from the original lock
            refundWallet.balance = refundWallet.balance.plus(transaction.amount);
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

        // Specific HTLC refund checks
        const refundAsset: Interfaces.IHtlcRefundAsset = transaction.data.asset.refund;
        const lockId: string = refundAsset.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = databaseWalletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new HtlcLockTransactionNotFoundError();
        }

        const lock: Interfaces.IHtlcLock = lockWallet.getAttribute("htlc.locks")[lockId];
        const lastBlock: Interfaces.IBlock = app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlock();
        const lastBlockEpochTimestamp: number = lastBlock.data.timestamp;
        const expiration: Interfaces.IHtlcExpiration = lock.expiration;
        if (
            (expiration.type === Enums.HtlcLockExpirationType.EpochTimestamp &&
                expiration.value > lastBlockEpochTimestamp) ||
            (expiration.type === Enums.HtlcLockExpirationType.BlockHeight && expiration.value > lastBlock.data.height)
        ) {
            throw new HtlcLockNotExpiredError();
        }
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        const lockId: string = data.asset.refund.lockTransactionId;

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

        const htlcRefundsInpool: Interfaces.ITransactionData[] = Array.from(
            await pool.getTransactionsByType(Enums.TransactionType.HtlcRefund),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        const alreadyHasPendingRefund: boolean = htlcRefundsInpool.some(
            transaction => transaction.asset.claim.lockTransactionId === lockId,
        );

        if (alreadyHasPendingRefund) {
            processor.pushError(data, "ERR_PENDING", `HtlcRefund for "${lockId}" already in the pool`);
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            app.log.warning(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }

        await this.throwIfCannotBeApplied(transaction, sender, walletRepository);

        sender.verifyTransactionNonceApply(transaction);

        sender.nonce = data.nonce;

        const lockId: string = data.asset.refund.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        assert(lockWallet && lockWallet.getAttribute("htlc.locks")[lockId]);

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks");
        const newBalance: Utils.BigNumber = lockWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        assert(!newBalance.isNegative());

        lockWallet.balance = newBalance;
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");

        const newLockedBalance: Utils.BigNumber = lockedBalance.minus(locks[lockId].amount);
        assert(!newLockedBalance.isNegative());

        if (newLockedBalance.isZero()) {
            lockWallet.forgetAttribute("htlc.lockedBalance");
        } else {
            lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);
        }

        delete locks[lockId];

        walletRepository.reindex(lockWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        sender.verifyTransactionNonceRevert(transaction);

        sender.nonce = sender.nonce.minus(1);

        // TODO: not so good to call database from here, would need a better way
        const databaseService: Contracts.Database.DatabaseService = app.get<Contracts.Database.DatabaseService>(
            Container.Identifiers.DatabaseService,
        );

        const lockId: string = transaction.data.asset.refund.lockTransactionId;
        const lockTransaction: Interfaces.ITransactionData = await databaseService.transactionsBusinessRepository.findById(
            lockId,
        );
        const lockWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(lockTransaction.senderPublicKey);

        lockWallet.balance = lockWallet.balance.minus(lockTransaction.amount).plus(transaction.data.fee);
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));
        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks");
        locks[lockTransaction.id] = {
            amount: lockTransaction.amount,
            recipientId: lockTransaction.recipientId,
            timestamp: lockTransaction.timestamp,
            vendorField: lockTransaction.vendorField ? lockTransaction.vendorField : undefined,
            ...lockTransaction.asset.lock,
        };

        walletRepository.reindex(lockWallet);
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
