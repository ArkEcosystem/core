// tslint:disable:max-classes-per-file
// tslint:disable:member-ordering

import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";
import {
    InsufficientBalanceError,
    InvalidMultiSignatureError,
    InvalidSecondSignatureError,
    SenderWalletMismatchError,
    UnexpectedMultiSignatureError,
    UnexpectedNonceError,
    UnexpectedSecondSignatureError,
} from "../errors";
import { ITransactionHandler } from "../interfaces";

export abstract class TransactionHandler implements ITransactionHandler {
    public abstract getConstructor(): Transactions.TransactionConstructor;

    /**
     * Wallet logic
     */
    public abstract async bootstrap(
        connection: Database.IConnection,
        walletManager: State.IWalletManager,
    ): Promise<void>;

    public verify(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): boolean {
        const senderWallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        if (senderWallet.multisignature) {
            transaction.isVerified = senderWallet.verifySignatures(transaction.data);
        }

        return transaction.isVerified;
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            return;
        }

        if (data.version > 1 && data.nonce.isLessThanOrEqualTo(sender.nonce)) {
            throw new UnexpectedNonceError(data.nonce, sender.nonce, false);
        }

        if (sender.balance.minus(data.amount).minus(data.fee).isNegative()) {
            throw new InsufficientBalanceError();
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
    }

    public apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        this.applyToSender(transaction, walletManager);
        this.applyToRecipient(transaction, walletManager);
    }

    public revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        this.revertForSender(transaction, walletManager);
        this.revertForRecipient(transaction, walletManager);
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            walletManager.logger.warn(
                `Transaction forcibly applied as an exception: ${transaction.id}.`
            );
        }

        this.throwIfCannotBeApplied(transaction, sender, walletManager);

        if (data.version > 1) {
            if (!sender.nonce.plus(1).isEqualTo(data.nonce)) {
                throw new UnexpectedNonceError(data.nonce, sender.nonce, false);
            }

            sender.nonce = data.nonce;
        }

        const newBalance: Utils.BigNumber = sender.balance.minus(data.amount).minus(data.fee);

        if (process.env.CORE_ENV === "test") {
            assert(Utils.isException(transaction.data) || !newBalance.isNegative());
        } else {
            assert(!newBalance.isNegative());
        }

        sender.balance = newBalance;
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        sender.balance = sender.balance.plus(data.amount).plus(data.fee);

        if (data.version > 1) {
            if (!sender.nonce.isEqualTo(data.nonce)) {
                throw new UnexpectedNonceError(data.nonce, sender.nonce, true);
            }

            sender.nonce = sender.nonce.minus(1);
        }
    }

    public abstract applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void;

    public abstract revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void;

    /**
     * Database Service
     */
    // tslint:disable-next-line:no-empty
    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {}

    /**
     * Transaction Pool logic
     */
    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        processor.pushError(
            data,
            "ERR_UNSUPPORTED",
            `Invalidating transaction of unsupported type '${Enums.TransactionTypes[data.type]}'`,
        );

        return false;
    }

    protected typeFromSenderAlreadyInPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        const { senderPublicKey, type }: Interfaces.ITransactionData = data;

        if (pool.senderHasTransactionsOfType(senderPublicKey, type)) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Sender ${senderPublicKey} already has a transaction of type '${Enums.TransactionTypes[type]}' in the pool`,
            );

            return true;
        }

        return false;
    }
}
