import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { constants, ITransactionData, Transaction } from "@arkecosystem/crypto";

export interface ITransactionService {
    getType(): constants.TransactionTypes | number;

    canBeApplied(transaction: Transaction, wallet: Database.IWallet, walletManager?: Database.IWalletManager): boolean;
    applyToSender(transaction: Transaction, wallet: Database.IWallet): void;
    applyToRecipient(transaction: Transaction, wallet: Database.IWallet): void;
    revertForSender(transaction: Transaction, wallet: Database.IWallet): void;
    revertForRecipient(transaction: Transaction, wallet: Database.IWallet): void;
    apply(transaction: Transaction, wallet: Database.IWallet): void;
    revert(transaction: Transaction, wallet: Database.IWallet): void;

    canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.ITransactionGuard): boolean;
    emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void;
}
