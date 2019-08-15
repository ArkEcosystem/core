import { Contracts } from "@arkecosystem/core-kernel";
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

    public async bootstrap(
        connection: Contracts.Database.IConnection,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
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
        sender: Contracts.State.IWallet,
        databaseWalletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        return super.throwIfCannotBeApplied(transaction, sender, databaseWalletManager);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.IConnection,
        processor: Contracts.TransactionPool.IProcessor,
    ): Promise<boolean> {
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

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const recipient: Contracts.State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.plus(transaction.data.amount);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const recipient: Contracts.State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
}
