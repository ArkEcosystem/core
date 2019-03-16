import { Database, EventEmitter } from "@arkecosystem/core-interfaces";
import { DelegateResignationTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class DelegateResignationTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return DelegateResignationTransaction;
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

    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit("delegate.resigned", transaction.data);
    }
}
