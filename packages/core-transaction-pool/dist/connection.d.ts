/// <reference types="node" />
import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { ITransactionsProcessed } from "./interfaces";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";
export declare class Connection implements TransactionPool.IConnection {
    options: Record<string, any>;
    walletManager: WalletManager;
    private readonly memory;
    private readonly storage;
    private readonly loggedAllowedSenders;
    private readonly databaseService;
    private readonly emitter;
    private readonly logger;
    constructor({ options, walletManager, memory, storage, }: {
        options: Record<string, any>;
        walletManager: WalletManager;
        memory: Memory;
        storage: Storage;
    });
    make(): Promise<this>;
    disconnect(): void;
    makeProcessor(): TransactionPool.IProcessor;
    getAllTransactions(): Interfaces.ITransaction[];
    getTransactionsByType(type: number, typeGroup?: number): Promise<Set<Interfaces.ITransaction>>;
    getPoolSize(): Promise<number>;
    getSenderSize(senderPublicKey: string): Promise<number>;
    addTransactions(transactions: Interfaces.ITransaction[]): Promise<ITransactionsProcessed>;
    removeTransaction(transaction: Interfaces.ITransaction): void;
    removeTransactionById(id: string, senderPublicKey?: string): void;
    removeTransactionsById(ids: string[]): void;
    getTransaction(id: string): Promise<Interfaces.ITransaction>;
    getTransactions(start: number, size: number, maxBytes?: number): Promise<Buffer[]>;
    getTransactionsForForging(blockSize: number): Promise<string[]>;
    getTransactionIdsForForging(start: number, size: number): Promise<string[]>;
    removeTransactionsForSender(senderPublicKey: string): void;
    hasExceededMaxTransactions(senderPublicKey: string): Promise<boolean>;
    flush(): void;
    has(transactionId: string): Promise<boolean>;
    acceptChainedBlock(block: Interfaces.IBlock): Promise<void>;
    buildWallets(): Promise<void>;
    purgeByPublicKey(senderPublicKey: string): void;
    purgeInvalidTransactions(): Promise<void>;
    senderHasTransactionsOfType(senderPublicKey: string, type: number, typeGroup?: number): Promise<boolean>;
    replay(transactions: Interfaces.ITransaction[]): Promise<void>;
    private getValidatedTransactions;
    private addTransaction;
    private syncToPersistentStorageIfNecessary;
    private syncToPersistentStorage;
    /**
     * Validate the given transactions and return only the valid ones - a subset of the input.
     * The invalid ones are removed from the pool.
     */
    private validateTransactions;
    private removeForgedTransactions;
    private purgeExpired;
    /**
     * Remove all provided transactions plus any transactions from the same senders with higher nonces.
     */
    private purgeTransactions;
}
