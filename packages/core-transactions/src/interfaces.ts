import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { TransactionHandlerConstructor } from "./handlers/transaction";

export interface ITransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;

    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;

    bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void>;

    isActivated(): Promise<boolean>;

    verify(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): boolean;

    dynamicFee(transaction: Interfaces.ITransaction, addonBytes: number, satoshiPerByte: number): Utils.BigNumber;

    throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void;
    apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void;
    revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void | Promise<void>;

    canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean;

    emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void;
}
