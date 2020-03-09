import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Blocks, Enums, Interfaces } from "@arkecosystem/crypto";
import { ITransactionsProcessed } from "../../../../packages/core-transaction-pool/src/interfaces";
import { Memory } from "../../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../../packages/core-transaction-pool/src/storage";
import { WalletManager } from "../../../../packages/core-transaction-pool/src/wallet-manager";

export class Connection implements TransactionPool.IConnection {
    public options: any;
    public loggedAllowedSenders: string[];
    public walletManager: any;
    public memory: any;
    public storage: any;

    constructor({
        options,
        walletManager,
        memory,
        storage,
    }: {
        options: Record<string, any>;
        walletManager: WalletManager;
        memory: Memory;
        storage: Storage;
    }) {
        this.options = options;
        this.walletManager = walletManager;
        this.memory = memory;
        this.storage = storage;
    }

    public async make(): Promise<this> {
        return this;
    }

    public driver(): any {
        return;
    }

    public disconnect(): void {
        return;
    }

    public async getPoolSize(): Promise<number> {
        return 0;
    }

    public async getSenderSize(senderPublicKey: string): Promise<number> {
        return 0;
    }

    public async addTransactions(transactions: Interfaces.ITransaction[]): Promise<ITransactionsProcessed> {
        return { added: [], notAdded: [] };
    }

    public addTransaction(transaction: Interfaces.ITransaction): TransactionPool.IAddTransactionResponse {
        return undefined;
    }

    public removeTransaction(transaction: Interfaces.ITransaction): void {
        return;
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        return;
    }

    public removeTransactionsById(ids: string[]): void {
        return;
    }

    public getAllTransactions(): Interfaces.ITransaction[] {
        return [];
    }

    public async getTransactionsForForging(blockSize: number): Promise<string[]> {
        return [];
    }

    public async getTransaction(id: string): Promise<Interfaces.ITransaction> {
        return undefined;
    }

    public async getTransactions(start: number, size: number, maxBytes?: number): Promise<Buffer[]> {
        return [];
    }

    public async getTransactionIdsForForging(start: number, size: number): Promise<string[]> {
        return undefined;
    }

    public getTransactionsByType(type: number, typeGroup?: number): any {
        return;
    }

    public removeTransactionsForSender(senderPublicKey: string): void {
        return;
    }

    public async hasExceededMaxTransactions(senderPublicKey: string): Promise<boolean> {
        return true;
    }

    public flush(): void {
        return;
    }

    public makeProcessor(): TransactionPool.IProcessor {
        return undefined;
    }

    public has(transactionId: string): any {
        return;
    }

    public async acceptChainedBlock(block: Blocks.Block): Promise<void> {
        return;
    }

    public async buildWallets(): Promise<void> {
        return;
    }

    public async replay(transactions: Interfaces.ITransaction[]): Promise<void> {
        return;
    }

    public purgeByPublicKey(senderPublicKey: string): void {
        return;
    }

    public async senderHasTransactionsOfType(
        senderPublicKey: string,
        transactionType: Enums.TransactionType,
    ): Promise<boolean> {
        return true;
    }
}
