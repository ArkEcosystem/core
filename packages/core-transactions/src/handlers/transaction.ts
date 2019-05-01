// tslint:disable:max-classes-per-file
// tslint:disable:member-ordering

import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import {
    InsufficientBalanceError,
    InvalidMultiSignatureError,
    InvalidSecondSignatureError,
    SenderWalletMismatchError,
    UnexpectedSecondSignatureError,
} from "../errors";
import { ITransactionHandler } from "../interfaces";

export abstract class TransactionHandler implements ITransactionHandler {
    // TODO: merge with canBeApplied ?
    // just a quick hack to get multi sig working
    public verify(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): boolean {
        const { data } = transaction;
        const senderWallet = walletManager.findByPublicKey(data.senderPublicKey);
        if (senderWallet.multisignature) {
            transaction.isVerified = senderWallet.verifySignatures(data);
        }

        return transaction.isVerified;
    }

    public abstract getConstructor(): Transactions.TransactionConstructor;

    /**
     * Wallet logic
     */
    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        databaseWalletManager: Database.IWalletManager,
    ): boolean {
        // NOTE: Checks if it can be applied based on sender wallet
        // could be merged with `apply` so they are coupled together :thinking_face:

        const { data } = transaction;
        if (
            wallet.balance
                .minus(data.amount)
                .minus(data.fee)
                .isLessThan(0)
        ) {
            throw new InsufficientBalanceError();
        }

        if (data.senderPublicKey !== wallet.publicKey) {
            throw new SenderWalletMismatchError();
        }

        if (wallet.secondPublicKey) {
            // Ensure the database wallet already has a 2nd signature, in case we checked a pool wallet.
            const databaseWallet = databaseWalletManager.findByPublicKey(transaction.data.senderPublicKey);
            if (!databaseWallet.secondPublicKey) {
                throw new UnexpectedSecondSignatureError();
            }

            if (!Transactions.Verifier.verifySecondSignature(data, wallet.secondPublicKey)) {
                throw new InvalidSecondSignatureError();
            }
        } else if (data.secondSignature || data.signSignature) {
            // TODO: get rid of this milestone by adding exceptions, the milestone is solely
            // necessary because of devnet.
            if (!Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField) {
                throw new UnexpectedSecondSignatureError();
            }
        }

        if (wallet.multisignature) {
            // Ensure the database wallet already has a multi signature, in case we checked a pool wallet.
            const databaseWallet = databaseWalletManager.findByPublicKey(transaction.data.senderPublicKey);
            if (!databaseWallet.multisignature) {
                throw new UnexpectedMultiSignatureError();
            }

            if (!wallet.verifySignatures(data, wallet.multisignature)) {
                throw new InvalidMultiSignatureError();
            }
        } else if (transaction.type !== Enums.TransactionTypes.MultiSignature && transaction.data.signatures) {
            throw new UnexpectedMultiSignatureError();
        }

        return true;
    }

    public apply(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        this.applyToSender(transaction, walletManager);
        this.applyToRecipient(transaction, walletManager);
    }

    public revert(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        this.revertForSender(transaction, walletManager);
        this.revertForRecipient(transaction, walletManager);
    }

    protected applyToSender(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        const { data } = transaction;
        const sender = walletManager.findByPublicKey(data.senderPublicKey);
        sender.balance = sender.balance.minus(data.amount).minus(data.fee);
    }

    protected revertForSender(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        const { data } = transaction;
        const sender = walletManager.findByPublicKey(data.senderPublicKey);
        sender.balance = sender.balance.plus(data.amount).plus(data.fee);
    }

    protected abstract applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Database.IWalletManager,
    ): void;
    protected abstract revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Database.IWalletManager,
    ): void;

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

    public applyToSenderInPool(transaction: any, poolWalletManager: Database.IWalletManager): void {
        this.applyToSender(transaction, poolWalletManager);
    }

    public revertForSenderInPool(transaction: any, poolWalletManager: Database.IWalletManager): void {
        this.revertForSender(transaction, poolWalletManager);
    }

    public applyToRecipientInPool(transaction: any, poolWalletManager: Database.IWalletManager): void {
        this.applyToRecipient(transaction, poolWalletManager);
    }

    public revertForRecipientInPool(transaction: any, poolWalletManager: Database.IWalletManager): void {
        this.revertForRecipient(transaction, poolWalletManager);
    }

    protected typeFromSenderAlreadyInPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        const { senderPublicKey, type } = data;

        if (pool.senderHasTransactionsOfType(senderPublicKey, type)) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Sender ${senderPublicKey} already has a transaction of type '${
                    Enums.TransactionTypes[type]
                }' in the pool`,
            );

            return true;
        }

        return false;
    }

    protected secondSignatureRegistrationFromSenderAlreadyInPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        const { senderPublicKey } = data;
        if (pool.senderHasTransactionsOfType(senderPublicKey, Enums.TransactionTypes.SecondSignature)) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Cannot accept transaction from sender ${senderPublicKey} while its second signature registration is in the pool`,
            );

            return true;
        }

        return false;
    }
}
