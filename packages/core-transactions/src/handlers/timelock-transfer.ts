import { Database } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class TimelockTransferTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.TimelockTransferTransaction;
    }

    public canBeApplied(
        transaction: Transactions.Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Transactions.Transaction, wallet: Database.IWallet): void {
        return;
    }

    public revert(transaction: Transactions.Transaction, wallet: Database.IWallet): void {
        return;
    }
}
