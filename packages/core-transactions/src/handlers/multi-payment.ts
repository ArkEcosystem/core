import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MultipaymentAmountMismatchError } from "../errors";
import { TransactionHandler } from "./transaction";

export class MultiPaymentTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.MultiPaymentTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);

        for (const transaction of transactions) {
            for (const payment of transaction.asset.payments) {
                const recipient: State.IWallet = walletManager.findByAddress(payment.recipientId);
                recipient.balance = recipient.balance.plus(payment.amount);
            }
        }
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        if (
            !transaction.data.amount.isEqualTo(
                transaction.data.asset.payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO),
            )
        ) {
            throw new MultipaymentAmountMismatchError();
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        return true;
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        for (const payment of transaction.data.asset.payments) {
            const recipient: State.IWallet = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.plus(payment.amount);
        }
    }

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        for (const payment of transaction.data.asset.payments) {
            const recipient: State.IWallet = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.minus(payment.amount);
        }
    }
}
