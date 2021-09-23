/// <reference types="node" />
import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Transaction } from "../models";
import { Repository } from "./repository";
export declare class TransactionsRepository extends Repository implements Database.ITransactionsRepository {
    search(parameters: Database.ISearchParameters): Promise<Database.ITransactionsPaginated>;
    findById(id: string): Promise<Interfaces.ITransactionData>;
    findByBlockId(id: string): Promise<Array<{
        id: string;
        serialized: Buffer;
    }>>;
    latestByBlock(id: string): Promise<Array<{
        id: string;
        serialized: Buffer;
    }>>;
    latestByBlocks(ids: string[]): Promise<Array<{
        id: string;
        blockId: string;
        serialized: Buffer;
    }>>;
    getCountOfType(type: number, typeGroup?: number): Promise<any>;
    getAssetsByType(type: number, typeGroup: number, limit: number, offset: number): Promise<any>;
    getReceivedTransactions(): Promise<any>;
    getSentTransactions(): Promise<any>;
    forged(ids: string[]): Promise<Interfaces.ITransactionData[]>;
    getOpenHtlcLocks(): Promise<any>;
    getRefundedHtlcLocks(): Promise<any>;
    getClaimedHtlcLocks(): Promise<any>;
    findByHtlcLocks(lockIds: string[]): Promise<Interfaces.ITransactionData[]>;
    statistics(): Promise<{
        count: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
    }>;
    deleteByBlockId(ids: string[], db: any): Promise<void>;
    getFeeStatistics(days: number, minFee?: number): Promise<Array<{
        type: number;
        fee: number;
        timestamp: number;
    }>>;
    getModel(): Transaction;
}
