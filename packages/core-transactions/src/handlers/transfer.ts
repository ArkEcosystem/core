import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { isRecipientOnActiveNetwork } from "../utils";
import { TransactionHandler } from "./transaction";

export class TransferTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.TransferTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getReceivedTransactions();

        for (const transaction of transactions) {
            const wallet = walletManager.findByAddress(transaction.recipientId);
            wallet.balance = wallet.balance.plus(transaction.amount);
        }
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        super.throwIfCannotBeApplied(transaction, sender, databaseWalletManager);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (!isRecipientOnActiveNetwork(data)) {
            processor.pushError(
                data,
                "ERR_INVALID_RECIPIENT",
                `Recipient ${data.recipientId} is not on the same network: ${Managers.configManager.get(
                    "network.pubKeyHash",
                )}`,
            );
            return false;
        }

        return true;
    }

    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const recipient: State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.plus(transaction.data.amount);
    }

    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const recipient: State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
}
