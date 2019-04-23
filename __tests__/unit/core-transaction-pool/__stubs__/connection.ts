import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Blocks, Enums, Interfaces } from "@arkecosystem/crypto";
import { Dato } from "@faustbrian/dato";
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

    public getPoolSize(): number {
        return 0;
    }

    public getSenderSize(senderPublicKey: string): number {
        return 0;
    }

    public addTransactions(transactions: Interfaces.ITransaction[]): ITransactionsProcessed {
        return { added: [], notAdded: [] };
    }

    public addTransaction(transaction: Interfaces.ITransaction): TransactionPool.IAddTransactionResponse {
        return null;
    }

    public removeTransaction(transaction: Interfaces.ITransaction): void {
        return;
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        return;
    }

    public getTransactionsForForging(blockSize: number): string[] {
        return [];
    }

    public getTransaction(id: string): Interfaces.ITransaction {
        return null;
    }

    public getTransactions(start: number, size: number, maxBytes?: number): Buffer[] {
        return [];
    }

    public getTransactionIdsForForging(start: number, size: number): string[] {
        return null;
    }

    public getTransactionsData<T>(start: number, size: number, property: string, maxBytes?: number): T[] {
        return null;
    }

    public getTransactionsByType(type: any): any {
        return;
    }

    public removeTransactionsForSender(senderPublicKey: string): void {
        return;
    }

    public hasExceededMaxTransactions(transaction: Interfaces.ITransactionData): boolean {
        return true;
    }

    public flush(): void {
        return;
    }

    public makeProcessor(): TransactionPool.IProcessor {
        return null;
    }

    public has(transactionId: string): any {
        return;
    }

    public isSenderBlocked(senderPublicKey: string): boolean {
        return true;
    }

    public blockSender(senderPublicKey: string): Dato {
        return null;
    }

    public acceptChainedBlock(block: Blocks.Block): void {
        return;
    }

    public async buildWallets(): Promise<void> {
        return;
    }

    public purgeByPublicKey(senderPublicKey: string): void {
        return;
    }

    public purgeSendersWithInvalidTransactions(block: Blocks.Block): void {
        return;
    }

    public purgeByBlock(block: Blocks.Block): void {
        return;
    }

    public senderHasTransactionsOfType(senderPublicKey: string, transactionType: Enums.TransactionTypes): boolean {
        return true;
    }
}
