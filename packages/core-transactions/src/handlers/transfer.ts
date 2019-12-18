import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { isRecipientOnActiveNetwork } from "../utils";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

export class TransferTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.TransferTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getReceivedTransactions();

        for (const transaction of transactions) {
            const wallet = walletManager.findByAddress(transaction.recipientId);
            wallet.balance = wallet.balance.plus(transaction.amount);
        }
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        return super.throwIfCannotBeApplied(transaction, sender, walletManager);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string, message: string } | null> {
        if (!isRecipientOnActiveNetwork(data)) {
            return {
                type: "ERR_INVALID_RECIPIENT",
                message: `Recipient ${data.recipientId} is not on the same network: ${Managers.configManager.get(
                    "network.pubKeyHash",
                )}`,
            };
        }

        return null;
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const recipient: State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.plus(transaction.data.amount);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const recipient: State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
}
