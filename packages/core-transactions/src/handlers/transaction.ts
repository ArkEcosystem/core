// tslint:disable:max-classes-per-file
// tslint:disable:member-ordering

import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";
import {
    ColdWalletError,
    InsufficientBalanceError,
    InvalidMultiSignatureError,
    InvalidSecondSignatureError,
    LegacyMultiSignatureError,
    SenderWalletMismatchError,
    UnexpectedMultiSignatureError,
    UnexpectedSecondSignatureError,
} from "../errors";
import { IDynamicFeeContext, ITransactionHandler } from "../interfaces";

export type TransactionHandlerConstructor = new () => TransactionHandler;

export abstract class TransactionHandler implements ITransactionHandler {
    public abstract getConstructor(): Transactions.TransactionConstructor;

    public abstract dependencies(): ReadonlyArray<TransactionHandlerConstructor>;

    public abstract walletAttributes(): ReadonlyArray<string>;

    /**
     * Wallet logic
     */
    public abstract async bootstrap(
        connection: Database.IConnection,
        walletManager: State.IWalletManager,
    ): Promise<void>;

    public async verify(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<boolean> {
        const senderWallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        if (senderWallet.hasMultiSignature()) {
            transaction.isVerified = senderWallet.verifySignatures(transaction.data);
        }

        return transaction.isVerified;
    }

    public abstract async isActivated(): Promise<boolean>;

    public dynamicFee({ addonBytes, satoshiPerByte, transaction }: IDynamicFeeContext): Utils.BigNumber {
        addonBytes = addonBytes || 0;

        if (satoshiPerByte <= 0) {
            satoshiPerByte = 1;
        }

        const transactionSizeInBytes: number = Math.round(transaction.serialized.length / 2);
        return Utils.BigNumber.make(addonBytes + transactionSizeInBytes).times(satoshiPerByte);
    }

    protected async performGenericWalletChecks(
        transaction: Interfaces.ITransaction,
        sender: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            return;
        }

        sender.verifyTransactionNonceApply(transaction);

        if (
            sender.balance
                .minus(data.amount)
                .minus(data.fee)
                .isNegative()
        ) {
            throw new InsufficientBalanceError();
        }

        if (data.senderPublicKey !== sender.publicKey) {
            throw new SenderWalletMismatchError();
        }

        const dbWalletManager: State.IWalletManager = app.resolvePlugin<Database.IDatabaseService>("database")
            .walletManager;

        if (sender.hasSecondSignature()) {
            // Ensure the database wallet already has a 2nd signature, in case we checked a pool wallet.
            const dbSender: State.IWallet = dbWalletManager.findByPublicKey(data.senderPublicKey);

            if (!dbSender.hasSecondSignature()) {
                throw new UnexpectedSecondSignatureError();
            }

            const secondPublicKey: string = dbSender.getAttribute("secondPublicKey");
            if (!Transactions.Verifier.verifySecondSignature(data, secondPublicKey)) {
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

        // Prevent legacy multi signatures from being used
        const isMultiSignatureRegistration: boolean =
            transaction.type === Enums.TransactionType.MultiSignature &&
            transaction.typeGroup === Enums.TransactionTypeGroup.Core;
        if (isMultiSignatureRegistration && !Managers.configManager.getMilestone().aip11) {
            throw new UnexpectedMultiSignatureError();
        }

        if (sender.hasMultiSignature()) {
            // Ensure the database wallet already has a multi signature, in case we checked a pool wallet.
            const dbSender: State.IWallet = dbWalletManager.findByPublicKey(transaction.data.senderPublicKey);

            if (dbSender.getAttribute("multiSignature").legacy) {
                throw new LegacyMultiSignatureError();
            }

            if (!dbSender.hasMultiSignature()) {
                throw new UnexpectedMultiSignatureError();
            }

            if (!dbSender.verifySignatures(data, dbSender.getAttribute("multiSignature"))) {
                throw new InvalidMultiSignatureError();
            }
        } else if (transaction.data.signatures && !isMultiSignatureRegistration) {
            throw new UnexpectedMultiSignatureError();
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        if (
            !walletManager.hasByPublicKey(sender.publicKey) &&
            walletManager.findByAddress(sender.address).balance.isZero()
        ) {
            throw new ColdWalletError();
        }

        return this.performGenericWalletChecks(transaction, sender, walletManager);
    }

    public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
        await this.applyToSender(transaction, walletManager);
        await this.applyToRecipient(transaction, walletManager);
    }

    public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
        await this.revertForSender(transaction, walletManager);
        await this.revertForRecipient(transaction, walletManager);
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

        let nonce: Utils.BigNumber;
        if (data.version > 1) {
            sender.verifyTransactionNonceApply(transaction);
            nonce = data.nonce;
        } else {
            nonce = sender.nonce.plus(1);
        }

        const newBalance: Utils.BigNumber = sender.balance.minus(data.amount).minus(data.fee);

        if (process.env.CORE_ENV === "test") {
            assert(Utils.isException(transaction.data) || !newBalance.isNegative());
        } else {
            if (newBalance.isNegative()) {
                const negativeBalanceExceptions: Record<string, Record<string, string>> =
                    Managers.configManager.get("exceptions.negativeBalances") || {};
                const negativeBalances: Record<string, string> = negativeBalanceExceptions[sender.publicKey] || {};
                if (!newBalance.isEqualTo(negativeBalances[nonce.toString()] || 0)) {
                    throw new InsufficientBalanceError();
                }
            }
        }

        sender.balance = newBalance;
        sender.nonce = nonce;
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (data.version > 1) {
            sender.verifyTransactionNonceRevert(transaction);
        }

        sender.balance = sender.balance.plus(data.amount).plus(data.fee);
        sender.nonce = sender.nonce.minus(1);
    }

    public abstract async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void>;

    public abstract async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void>;

    /**
     * Database Service
     */
    // tslint:disable-next-line:no-empty
    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {}

    /**
     * Transaction Pool logic
     */
    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string, message: string } | null> {
        return {
            type: "ERR_UNSUPPORTED",
            message: `Invalidating transaction of unsupported type '${Enums.TransactionType[data.type]}'`,
        };
    }

    protected async typeFromSenderAlreadyInPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
    ): Promise<{ type: string, message: string } | null> {
        const { senderPublicKey, type }: Interfaces.ITransactionData = data;

        if (await pool.senderHasTransactionsOfType(senderPublicKey, type)) {
            return {
                type: "ERR_PENDING",
                message: `Sender ${senderPublicKey} already has a transaction of type '${Enums.TransactionType[type]}' in the pool`,
            };
        }

        return null;
    }
}
