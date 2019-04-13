import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class MultiPaymentTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.MultiPaymentTransaction;
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        return;
    }

    public revert(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        return;
    }
}
