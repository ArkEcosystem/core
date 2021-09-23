/// <reference types="node" />
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { IDynamicFeeContext, ITransactionHandler } from "../interfaces";
export declare type TransactionHandlerConstructor = new () => TransactionHandler;
export declare abstract class TransactionHandler implements ITransactionHandler {
    abstract getConstructor(): Transactions.TransactionConstructor;
    abstract dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    abstract walletAttributes(): ReadonlyArray<string>;
    /**
     * Wallet logic
     */
    abstract bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void>;
    verify(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<boolean>;
    abstract isActivated(): Promise<boolean>;
    dynamicFee({ addonBytes, satoshiPerByte, transaction }: IDynamicFeeContext): Utils.BigNumber;
    protected performGenericWalletChecks(transaction: Interfaces.ITransaction, sender: State.IWallet, walletManager: State.IWalletManager): Promise<void>;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, sender: State.IWallet, walletManager: State.IWalletManager): Promise<void>;
    apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    abstract applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    abstract revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void>;
    /**
     * Database Service
     */
    emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void;
    /**
     * Transaction Pool logic
     */
    canEnterTransactionPool(data: Interfaces.ITransactionData, pool: TransactionPool.IConnection, processor: TransactionPool.IProcessor): Promise<{
        type: string;
        message: string;
    } | null>;
    protected typeFromSenderAlreadyInPool(data: Interfaces.ITransactionData, pool: TransactionPool.IConnection): Promise<{
        type: string;
        message: string;
    } | null>;
}
