import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

export interface ITransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;

    verify(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): boolean;

    canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        databaseWalletManager: Database.IWalletManager,
    ): boolean;
    apply(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void;
    revert(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void;

    canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean;

    emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void;
}
