import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { isRecipientOnActiveNetwork } from "../utils";
import { TransactionHandler } from "./transaction";

export class TransferTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.TransferTransaction;
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        databaseWalletManager: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, databaseWalletManager);
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

    protected applyToRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        const { data } = transaction;
        const recipient = walletManager.findByAddress(data.recipientId);
        recipient.balance = recipient.balance.plus(data.amount);
    }

    protected revertForRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        const { data } = transaction;
        const recipient = walletManager.findByAddress(data.recipientId);
        recipient.balance = recipient.balance.minus(data.amount);
    }
}
