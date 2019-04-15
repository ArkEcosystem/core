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
        walletManager?: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public apply(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        return;
    }

    public revert(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        return;
    }

    public canEnterTransactionPool(data: Interfaces.ITransactionData, guard: TransactionPool.IGuard): boolean {
        if (!isRecipientOnActiveNetwork(data)) {
            guard.pushError(
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
}
