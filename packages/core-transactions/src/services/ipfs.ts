import { Database } from "@arkecosystem/core-interfaces";
import { IpfsTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { TransactionService } from "./transaction";

export class IpfsTransactionService extends TransactionService {
    public getConstructor(): TransactionConstructor {
        return IpfsTransaction;
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
