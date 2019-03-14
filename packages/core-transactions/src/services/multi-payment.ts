import { Database } from "@arkecosystem/core-interfaces";
import { MultiPaymentTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { TransactionService } from "./transaction";

export class MultiPaymentTransactionService extends TransactionService {
    public getConstructor(): TransactionConstructor {
        return MultiPaymentTransaction;
    }

    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        return;
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        return;
    }
}
