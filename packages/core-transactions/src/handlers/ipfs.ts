import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class IpfsTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.IpfsTransaction;
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    protected applyToRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        return;
    }

    protected revertForRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        return;
    }
}
