import { Database, EventEmitter } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class DelegateResignationTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.DelegateResignationTransaction;
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

    public emitEvents(transaction: Transactions.Transaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit("delegate.resigned", transaction.data);
    }
}
