import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { TransactionHandlerConstructor } from "./handlers/transaction";

export interface ITransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;

    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;

    walletAttributes(): ReadonlyArray<string>;

    bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void>;

    isActivated(): Promise<boolean>;

    verify(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<boolean>;

    dynamicFee(context: IDynamicFeeContext): Utils.BigNumber;

    throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void>;
    apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;

    /**
     * Check if a transaction of this type can enter the pool.
     * An error object is returned to designate that the transaction cannot enter
     * the pool, or null if it can enter.
     */
    canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string, message: string } | null>;

    emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void;
}

export interface IDynamicFeeContext {
    transaction: Interfaces.ITransaction;
    addonBytes: number;
    satoshiPerByte: number;
    height: number;
}
