import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    configManager,
    interfaces,
    Transaction,
    TransactionConstructor,
    TransferTransaction,
} from "@arkecosystem/crypto";
import { isRecipientOnActiveNetwork } from "../utils";
import { TransactionHandler } from "./transaction";

export class TransferTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return TransferTransaction;
    }

    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public hasVendorField(): boolean {
        return true;
    }

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        return;
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        return;
    }

    public canEnterTransactionPool(data: interfaces.ITransactionData, guard: TransactionPool.IGuard): boolean {
        if (!isRecipientOnActiveNetwork(data)) {
            guard.pushError(
                data,
                "ERR_INVALID_RECIPIENT",
                `Recipient ${data.recipientId} is not on the same network: ${configManager.get("pubKeyHash")}`,
            );
            return false;
        }

        return true;
    }
}
