import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { isRecipientOnActiveNetwork } from "../utils";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

// todo: revisit container usage and arguments after core-database rework
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
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getReceivedTransactions();

        for (const transaction of transactions) {
            const wallet = walletRepository.findByAddress(transaction.recipientId);
            wallet.balance = wallet.balance.plus(transaction.amount);
        }
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        return super.throwIfCannotBeApplied(transaction, sender, databaseWalletRepository);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
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
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const recipient: Contracts.State.Wallet = walletRepository.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.plus(transaction.data.amount);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const recipient: Contracts.State.Wallet = walletRepository.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
}
