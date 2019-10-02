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
        console.time('multipayment bootstrap');
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());
        reader.bufferSize = 100000000;

        while (reader.hasNext()) {
            console.time('multipayment bootstrap read');
            const rows = await reader.read();
            console.timeEnd('multipayment bootstrap read');
            console.log(`read ${rows.length} of ${reader.count} rows`);
            console.time('multipayment bootstrap apply');
            for (const row of rows) {
                if (row.senderPublicKey) {
                    //console.log(`row: 1: ${JSON.stringify(row)}`);
                    const sender: State.IWallet = walletManager.findByPublicKey(row.senderPublicKey);
                    sender.balance = sender.balance.minus(row.amount);
                    //walletManager.reindex(sender);
                } else {
                    //console.log(`row: 2: ${JSON.stringify(row)}`);
                    const recipient: State.IWallet = walletManager.findByAddress(row.recipientId);
                    recipient.balance = recipient.balance.plus(row.amount);
                    //walletManager.reindex(recipient);
                }
            }
            console.timeEnd('multipayment bootstrap apply');
        }
        console.timeEnd('multipayment bootstrap');
        //walletManager.allByAddress().sort((a, b) => a.address < b.address ? -1 : (a.address === b.address ? 0 : 1)).forEach(w => console.log(`${w.address}: ${w.balance.toFixed()}`));
        //walletManager.allByAddress().forEach(w => console.log(`${w.address}: ${w.balance.toFixed()}`));
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
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
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        return true;
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
