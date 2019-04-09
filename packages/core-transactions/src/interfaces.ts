import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

export interface ITransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;

    canBeApplied(
        transaction: Transactions.Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean;
    applyToSender(transaction: Transactions.Transaction, wallet: Database.IWallet): void;
    applyToRecipient(transaction: Transactions.Transaction, wallet: Database.IWallet): void;
    revertForSender(transaction: Transactions.Transaction, wallet: Database.IWallet): void;
    revertForRecipient(transaction: Transactions.Transaction, wallet: Database.IWallet): void;
    apply(transaction: Transactions.Transaction, wallet: Database.IWallet): void;
    revert(transaction: Transactions.Transaction, wallet: Database.IWallet): void;

    canEnterTransactionPool(data: Interfaces.ITransactionData, guard: TransactionPool.IGuard): boolean;
    emitEvents(transaction: Transactions.Transaction, emitter: EventEmitter.EventEmitter): void;
}
