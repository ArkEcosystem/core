import { Database, EventEmitter } from "@arkecosystem/core-interfaces";
import { constants, models, Transaction } from "@arkecosystem/crypto";
import { TransactionService } from "./transaction";

export class DelegateResignationTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.DelegateResignation;
    }

    public canBeApplied(
        transaction: Transaction,
        wallet: models.Wallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Transaction, wallet: models.Wallet): void {
        return;
    }

    public revert(transaction: Transaction, wallet: models.Wallet): void {
        return;
    }

    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit("delegate.resigned", transaction.data);
    }
}
