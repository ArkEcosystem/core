import { app, Contracts } from "@arkecosystem/core-kernel";
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
import { TransactionHandler as TransactionHandlerContract } from "../interfaces";

export type TransactionHandlerConstructor = new () => TransactionHandler;

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
export abstract class TransactionHandler implements TransactionHandlerContract {
    public abstract getConstructor(): Transactions.TransactionConstructor;

    public abstract dependencies(): ReadonlyArray<TransactionHandlerConstructor>;

    public abstract walletAttributes(): ReadonlyArray<string>;

    /**
     * Wallet logic
     */
    public abstract async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void>;

    public async verify(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<boolean> {
        const senderWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        if (senderWallet.hasMultiSignature()) {
            transaction.isVerified = senderWallet.verifySignatures(transaction.data);
        }

        return transaction.isVerified;
    }

    public abstract async isActivated(): Promise<boolean>;

    public dynamicFee(
        transaction: Interfaces.ITransaction,
        addonBytes: number,
        satoshiPerByte: number,
    ): Utils.BigNumber {
        addonBytes = addonBytes || 0;

        if (satoshiPerByte <= 0) {
            satoshiPerByte = 1;
        }

        const transactionSizeInBytes: number = Math.round(transaction.serialized.length / 2);
        return Utils.BigNumber.make(addonBytes + transactionSizeInBytes).times(satoshiPerByte);
    }

    protected async performGenericWalletChecks(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
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

        if (sender.hasSecondSignature()) {
            // Ensure the database wallet already has a 2nd signature, in case we checked a pool wallet.
            const dbSender: Contracts.State.Wallet = databaseWalletRepository.findByPublicKey(data.senderPublicKey);

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
            const dbSender: Contracts.State.Wallet = databaseWalletRepository.findByPublicKey(
                transaction.data.senderPublicKey,
            );

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
        databaseWalletManager: State.IWalletManager,
    ): Promise<void> {
        if (
            !databaseWalletManager.hasByPublicKey(sender.publicKey) &&
            databaseWalletManager.findByAddress(sender.address).balance.isZero()
        ) {
            throw new ColdWalletError();
        }

        return this.performGenericWalletChecks(transaction, sender, databaseWalletManager);
    }

    public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
        await this.applyToSender(transaction, walletManager);
        await this.applyToRecipient(transaction, walletManager);
    }

    public async revert(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await this.revertForSender(transaction, walletRepository);
        await this.revertForRecipient(transaction, walletRepository);
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

        let nonce: Utils.BigNumber;
        if (data.version > 1) {
            sender.verifyTransactionNonceApply(transaction);
            nonce = data.nonce;
        } else {
            nonce = sender.nonce.plus(1);
        }

        sender.nonce = nonce;

        const newBalance: Utils.BigNumber = sender.balance.minus(data.amount).minus(data.fee);

        if (process.env.CORE_ENV === "test") {
            assert(Utils.isException(transaction.data) || !newBalance.isNegative());
        } else {
            assert(!newBalance.isNegative());
        }

        sender.balance = newBalance;
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        sender.balance = sender.balance.plus(data.amount).plus(data.fee);

        if (data.version > 1) {
            sender.verifyTransactionNonceRevert(transaction);
        }

        sender.nonce = sender.nonce.minus(1);
    }

    public abstract async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void>;

    public abstract async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void>;

    /**
     * Database Service
     */
    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {}

    /**
     * Transaction Pool logic
     */
    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        processor.pushError(
            data,
            "ERR_UNSUPPORTED",
            `Invalidating transaction of unsupported type '${Enums.TransactionType[data.type]}'`,
        );

        return false;
    }

    protected async typeFromSenderAlreadyInPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        const { senderPublicKey, type }: Interfaces.ITransactionData = data;

        if (await pool.senderHasTransactionsOfType(senderPublicKey, type)) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Sender ${senderPublicKey} already has a transaction of type '${Enums.TransactionType[type]}' in the pool`,
            );

            return true;
        }

        return false;
    }
}
