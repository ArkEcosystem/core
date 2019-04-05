// tslint:disable:max-classes-per-file

import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    configManager,
    constants,
    crypto,
    ITransactionData,
    Transaction,
    TransactionConstructor,
} from "@arkecosystem/crypto";

import {
    InsufficientBalanceError,
    InvalidSecondSignatureError,
    SenderWalletMismatchError,
    UnexpectedMultiSignatureError,
    UnexpectedSecondSignatureError,
} from "../errors";
import { ITransactionHandler } from "../interfaces";

const { TransactionTypes } = constants;

export abstract class TransactionHandler implements ITransactionHandler {
    public abstract getConstructor(): TransactionConstructor;

    /**
     * Wallet logic
     */
    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        // NOTE: Checks if it can be applied based on sender wallet
        // could be merged with `apply` so they are coupled together :thinking_face:

        const { data } = transaction;
        if (wallet.multisignature) {
            throw new UnexpectedMultiSignatureError();
        }

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
            if (!crypto.verifySecondSignature(data, wallet.secondPublicKey)) {
                throw new InvalidSecondSignatureError();
            }
        } else {
            if (data.secondSignature || data.signSignature) {
                // Accept invalid second signature fields prior the applied patch.
                // NOTE: only applies to devnet.
                if (!configManager.getMilestone().ignoreInvalidSecondSignatureField) {
                    throw new UnexpectedSecondSignatureError();
                }
            }
        }

        return true;
    }

    public applyToSender(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.senderPublicKey === wallet.publicKey || crypto.getAddress(data.senderPublicKey) === wallet.address) {
            wallet.balance = wallet.balance.minus(data.amount).minus(data.fee);

            this.apply(transaction, wallet);
        }
    }

    public applyToRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.recipientId === wallet.address) {
            wallet.balance = wallet.balance.plus(data.amount);
        }
    }

    public revertForSender(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.senderPublicKey === wallet.publicKey || crypto.getAddress(data.senderPublicKey) === wallet.address) {
            wallet.balance = wallet.balance.plus(data.amount).plus(data.fee);

            this.revert(transaction, wallet);
        }
    }

    public revertForRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.recipientId === wallet.address) {
            wallet.balance = wallet.balance.minus(data.amount);
        }
    }

    public abstract apply(transaction: Transaction, wallet: Database.IWallet): void;
    public abstract revert(transaction: Transaction, wallet: Database.IWallet): void;

    /**
     * Database Service
     */
    // tslint:disable-next-line:no-empty
    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {}

    /**
     * Transaction Pool logic
     */
    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        guard.pushError(
            data,
            "ERR_UNSUPPORTED",
            `Invalidating transaction of unsupported type '${TransactionTypes[data.type]}'`,
        );
        return false;
    }

    protected typeFromSenderAlreadyInPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        const { senderPublicKey, type } = data;
        if (guard.pool.senderHasTransactionsOfType(senderPublicKey, type)) {
            guard.pushError(
                data,
                "ERR_PENDING",
                `Sender ${senderPublicKey} already has a transaction of type '${TransactionTypes[type]}' in the pool`,
            );

            return true;
        }

        return false;
    }
}
