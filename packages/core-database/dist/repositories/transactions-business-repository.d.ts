import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
export declare class TransactionsBusinessRepository implements Database.ITransactionsBusinessRepository {
    private readonly databaseServiceProvider;
    constructor(databaseServiceProvider: () => Database.IDatabaseService);
    search(params?: Database.IParameters, sequenceOrder?: "asc" | "desc"): Promise<Database.ITransactionsPaginated>;
    allVotesBySender(senderPublicKey: string, parameters?: Database.IParameters): Promise<Database.ITransactionsPaginated>;
    findAllByBlock(blockId: string, parameters?: Database.IParameters): Promise<Database.ITransactionsPaginated>;
    findAllByRecipient(recipientId: string, parameters?: Database.IParameters): Promise<Database.ITransactionsPaginated>;
    findAllBySender(senderPublicKey: string, parameters?: Database.IParameters): Promise<Database.ITransactionsPaginated>;
    findAllByType(type: number, parameters?: Database.IParameters): Promise<Database.ITransactionsPaginated>;
    findById(id: string): Promise<Interfaces.ITransactionData>;
    findByTypeAndId(type: number, id: string): Promise<Interfaces.ITransactionData>;
    getFeeStatistics(days: number): Promise<Array<{
        type: number;
        fee: number;
        timestamp: number;
    }>>;
    getCountOfType(type: number, typeGroup?: number): Promise<number>;
    getAssetsByType(type: number, typeGroup: number, limit: number, offset: number): Promise<any>;
    getReceivedTransactions(): Promise<any>;
    getSentTransactions(): Promise<any>;
    getOpenHtlcLocks(): Promise<any>;
    getRefundedHtlcLocks(): Promise<any>;
    getClaimedHtlcLocks(): Promise<any>;
    findByHtlcLocks(lockIds: string[]): Promise<Interfaces.ITransactionData[]>;
    private getPublicKeyFromAddress;
    private mapBlocksToTransactions;
    private getCachedBlock;
    private cacheBlock;
    private parseSearchParameters;
}
