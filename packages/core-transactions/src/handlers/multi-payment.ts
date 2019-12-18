import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
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

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const sender: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                for (const payment of transaction.asset.payments) {
                    const recipient: State.IWallet = walletManager.findByAddress(payment.recipientId);
                    recipient.balance = recipient.balance.plus(payment.amount);
                    sender.balance = sender.balance.minus(payment.amount);
                }
            }
        }
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
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

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string, message: string } | null> {
        return null;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.minus(totalPaymentsAmount);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const totalPaymentsAmount = transaction.data.asset.payments.reduce(
            (a, p) => a.plus(p.amount),
            Utils.BigNumber.ZERO,
        );
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.plus(totalPaymentsAmount);
    }

    // tslint:disable-next-line:no-empty
    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        for (const payment of transaction.data.asset.payments) {
            const recipient: State.IWallet = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.plus(payment.amount);
        }
    }

    // tslint:disable-next-line:no-empty
    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        for (const payment of transaction.data.asset.payments) {
            const recipient: State.IWallet = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.minus(payment.amount);
        }
    }
}
