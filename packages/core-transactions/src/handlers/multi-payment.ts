import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { InsufficientBalanceError } from "../errors";
import { TransactionReader } from "../transaction-reader";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

// tslint:disable-next-line: max-classes-per-file
export class MultiPaymentTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.MultiPaymentTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);

                const payments: Interfaces.IMultiPaymentItem[] = AppUtils.assert.defined(transaction.asset.payments);
                for (const payment of payments) {
                    const recipient: Contracts.State.Wallet = walletRepository.findByAddress(payment.recipientId);

                    recipient.balance = recipient.balance.plus(payment.amount);
                    sender.balance = sender.balance.minus(payment.amount);
                }
            }
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const payments: Interfaces.IMultiPaymentItem[] = AppUtils.assert.defined(transaction.data.asset!.payments);
        const totalPaymentsAmount = payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);

        if (
            wallet.balance
                .minus(totalPaymentsAmount)
                .minus(transaction.data.fee)
                .isNegative()
        ) {
            throw new InsufficientBalanceError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletRepository);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, walletRepository);

        const payments: Interfaces.IMultiPaymentItem[] = AppUtils.assert.defined(transaction.data.asset!.payments);

        const totalPaymentsAmount = payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            AppUtils.assert.defined(transaction.data.senderPublicKey),
        );

        sender.balance = sender.balance.minus(totalPaymentsAmount);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, walletRepository);

        const payments: Interfaces.IMultiPaymentItem[] = AppUtils.assert.defined(transaction.data.asset!.payments);

        const totalPaymentsAmount = payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            AppUtils.assert.defined(transaction.data.senderPublicKey),
        );

        sender.balance = sender.balance.plus(totalPaymentsAmount);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const payments: Interfaces.IMultiPaymentItem[] = AppUtils.assert.defined(transaction.data.asset!.payments);

        for (const payment of payments) {
            const recipient: Contracts.State.Wallet = walletRepository.findByAddress(payment.recipientId);

            recipient.balance = recipient.balance.plus(payment.amount);
        }
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const payments: Interfaces.IMultiPaymentItem[] = AppUtils.assert.defined(transaction.data.asset!.payments);

        for (const payment of payments) {
            const recipient: Contracts.State.Wallet = walletRepository.findByAddress(payment.recipientId);

            recipient.balance = recipient.balance.minus(payment.amount);
        }
    }
}
