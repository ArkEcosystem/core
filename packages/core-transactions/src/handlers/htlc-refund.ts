import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert = require("assert");
import {
    HtlcLockedAmountLowerThanFeeError,
    HtlcLockNotExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcNotLockSenderError,
    InvalidMultiSignatureError,
    InvalidSecondSignatureError,
    SenderWalletMismatchError,
    UnexpectedMultiSignatureError,
    UnexpectedNonceError,
    UnexpectedSecondSignatureError,
} from "../errors";
import { TransactionHandler } from "./transaction";

export class HtlcRefundTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.HtlcRefundTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const lockId = transaction.asset.refund.lockTransactionId;
            const lockWallet: State.IWallet = walletManager.findByLockId(lockId);
            lockWallet.balance = lockWallet.balance.plus(lockWallet.locks[lockId].amount).minus(transaction.fee);
            lockWallet.lockedBalance = lockWallet.lockedBalance.minus(lockWallet.locks[lockId].amount);
            delete lockWallet.locks[lockId];
        }
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        // Common checks (copied from inherited transaction handler class)
        // Only common balance check was removed because we need a specific balance check here
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            return;
        }

        if (data.version > 1 && data.nonce.isLessThanOrEqualTo(sender.nonce)) {
            throw new UnexpectedNonceError(data.nonce, sender.nonce, false);
        }

        if (data.senderPublicKey !== sender.publicKey) {
            throw new SenderWalletMismatchError();
        }

        if (sender.secondPublicKey) {
            // Ensure the database wallet already has a 2nd signature, in case we checked a pool wallet.
            const dbSender: State.IWallet = databaseWalletManager.findByPublicKey(data.senderPublicKey);
            if (!dbSender.secondPublicKey) {
                throw new UnexpectedSecondSignatureError();
            }

            if (!Transactions.Verifier.verifySecondSignature(data, sender.secondPublicKey)) {
                throw new InvalidSecondSignatureError();
            }
        } else if (data.secondSignature || data.signSignature) {
            const isException =
                Managers.configManager.get("network.name") === "devnet" &&
                Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField;
            if (!isException) {
                throw new UnexpectedSecondSignatureError();
            }
        }

        if (sender.multisignature) {
            // Ensure the database wallet already has a multi signature, in case we checked a pool wallet.
            const dbSender: State.IWallet = databaseWalletManager.findByPublicKey(data.senderPublicKey);
            if (!dbSender.multisignature) {
                throw new UnexpectedMultiSignatureError();
            }

            if (!sender.verifySignatures(data, sender.multisignature)) {
                throw new InvalidMultiSignatureError();
            }
        } else if (transaction.type !== Enums.TransactionTypes.MultiSignature && transaction.data.signatures) {
            throw new UnexpectedMultiSignatureError();
        }

        // Specific HTLC refund checks
        const refundAsset = transaction.data.asset.refund;
        const lockId = refundAsset.lockTransactionId;
        const lockWallet = databaseWalletManager.findByLockId(lockId);
        if (!lockWallet) {
            throw new HtlcLockTransactionNotFoundError();
        }

        if (lockWallet.locks[lockId].amount.minus(transaction.data.fee).isNegative()) {
            throw new HtlcLockedAmountLowerThanFeeError();
        }

        if (lockWallet.locks[lockId].senderPublicKey !== transaction.data.senderPublicKey) {
            throw new HtlcNotLockSenderError();
        }

        const lastBlock: Interfaces.IBlock = app
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .getLastBlock();
        if (lockWallet.locks[lockId].asset.lock.expiration > lastBlock.data.timestamp) {
            throw new HtlcLockNotExpiredError();
        }
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        const lockId = data.asset.refund.lockTransactionId;
        const lockWallet: State.IWallet = pool.walletManager.findByLockId(lockId);
        if (!lockWallet || !lockWallet.locks[lockId]) {
            processor.pushError(
                data,
                "ERR_HTLCLOCKNOTFOUND",
                `The associated lock transaction id "${lockId}" was not found.`,
            );
            return false;
        }

        return true;
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            walletManager.logger.warn(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }

        this.throwIfCannotBeApplied(transaction, sender, walletManager);

        if (data.version > 1) {
            if (!sender.nonce.plus(1).isEqualTo(data.nonce)) {
                throw new UnexpectedNonceError(data.nonce, sender.nonce, false);
            }

            sender.nonce = data.nonce;
        }

        const lockId = data.asset.refund.lockTransactionId;
        const lockWallet: State.IWallet = walletManager.findByLockId(lockId); // lockWallet === senderWallet
        assert(lockWallet && lockWallet.locks[lockId]);

        const newBalance = lockWallet.balance.plus(lockWallet.locks[lockId].amount).minus(data.fee);
        assert(!newBalance.isNegative());

        lockWallet.balance = newBalance;
        lockWallet.lockedBalance = lockWallet.lockedBalance.minus(lockWallet.locks[lockId].amount);
        delete lockWallet.locks[lockId];

        walletManager.reindex(lockWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (data.version > 1) {
            if (!sender.nonce.isEqualTo(data.nonce)) {
                throw new UnexpectedNonceError(data.nonce, sender.nonce, true);
            }

            sender.nonce = sender.nonce.minus(1);
        }

        // todo to improve : not so good to call database from here, would need a better way
        const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

        const lockId = transaction.data.asset.refund.lockTransactionId;
        const lockTransaction = await databaseService.transactionsBusinessRepository.findById(lockId);
        const lockWallet = walletManager.findByPublicKey(lockTransaction.senderPublicKey);

        lockWallet.balance = lockWallet.balance.minus(lockTransaction.amount).plus(transaction.data.fee);
        lockWallet.lockedBalance = lockWallet.lockedBalance.plus(lockTransaction.amount);
        lockWallet.locks[lockTransaction.id] = lockTransaction;

        walletManager.reindex(lockWallet);
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
