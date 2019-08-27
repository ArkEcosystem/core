import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { InsufficientBalanceError } from "../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

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
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);

        for (const transaction of transactions) {
            const sender: Contracts.State.Wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            for (const payment of transaction.asset.payments) {
                const recipient: Contracts.State.Wallet = walletManager.findByAddress(payment.recipientId);
                recipient.balance = recipient.balance.plus(payment.amount);
                sender.balance = sender.balance.minus(payment.amount);
            }
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );

        if (
            wallet.balance
                .minus(totalPaymentsAmount)
                .minus(transaction.data.fee)
                .isNegative()
        ) {
            throw new InsufficientBalanceError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
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
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );
        const sender: Contracts.State.Wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.minus(totalPaymentsAmount);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );
        const sender: Contracts.State.Wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.plus(totalPaymentsAmount);
    }

    // tslint:disable-next-line:no-empty
    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        for (const payment of transaction.data.asset.payments) {
            const recipient: Contracts.State.Wallet = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.plus(payment.amount);
        }
    }

    // tslint:disable-next-line:no-empty
    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        for (const payment of transaction.data.asset.payments) {
            const recipient: Contracts.State.Wallet = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.minus(payment.amount);
        }
    }
}
