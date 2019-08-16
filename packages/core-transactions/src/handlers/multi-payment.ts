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
        connection: Contracts.Database.IConnection,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);

        for (const transaction of transactions) {
            const sender: Contracts.State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            for (const payment of transaction.asset.payments) {
                const recipient: Contracts.State.IWallet = walletManager.findByAddress(payment.recipientId);
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
        wallet: Contracts.State.IWallet,
        databaseWalletManager: Contracts.State.IWalletManager,
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
        pool: Contracts.TransactionPool.IConnection,
        processor: Contracts.TransactionPool.IProcessor,
    ): Promise<boolean> {
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );
        const sender: Contracts.State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.minus(totalPaymentsAmount);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );
        const sender: Contracts.State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.plus(totalPaymentsAmount);
    }

    // tslint:disable-next-line:no-empty
    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        for (const payment of transaction.data.asset.payments) {
            const recipient: Contracts.State.IWallet = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.plus(payment.amount);
        }
    }

    // tslint:disable-next-line:no-empty
    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        for (const payment of transaction.data.asset.payments) {
            const recipient: Contracts.State.IWallet = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.minus(payment.amount);
        }
    }
}
