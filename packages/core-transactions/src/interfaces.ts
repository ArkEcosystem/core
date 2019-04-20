import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

export interface ITransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;

    canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean;
    applyToSender(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void;
    applyToRecipient(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void;
    revertForSender(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void;
    revertForRecipient(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void;
    apply(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void;
    revert(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void;

    canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean;

    emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void;
}
