import { Interfaces, Utils } from "@arkecosystem/crypto";
import { ITransactionsPaginated } from "../business-repository";
import { ISearchParameters } from "../search";
import { IRepository } from "./repository";

export interface IBootstrapTransaction {
    id: string;
    version: number;
    timestamp: number;
    senderPublicKey: string;
    recipientId: string;
    fee: string;
    amount: string;
    vendorField: string;
    asset: Interfaces.ITransactionAsset;
    blockId: string;
    blockGeneratorPublicKey: string;
    blockHeight: number;
    blockReward: string;
}

export interface ITransactionsRepository extends IRepository {
    findById(id: string): Promise<Interfaces.ITransactionData>;

    findByBlockId(
        blockId: string,
    ): Promise<
        Array<{
            id: string;
            serialized: Buffer;
        }>
    >;

    latestByBlock(
        blockId: string,
    ): Promise<
        Array<{
            id: string;
            serialized: Buffer;
        }>
    >;

    latestByBlocks(
        blockIds: string[],
    ): Promise<
        Array<{
            id: string;
            blockId: string;
            serialized: Buffer;
        }>
    >;

    getCountOfType(type: number, typeGroup?: number): Promise<number>;

    getAssetsByType(type: number, typeGroup: number, limit: number, offset: number): Promise<IBootstrapTransaction[]>;

    getOpenHtlcLocks(): Promise<any>;

    getRefundedHtlcLocks(): Promise<any>;

    getClaimedHtlcLocks(): Promise<any>;

    getReceivedTransactions(): Promise<any>;

    getSentTransactions(): Promise<any>;

    forged(ids: string[]): Promise<Interfaces.ITransactionData[]>;

    findByHtlcLocks(lockIds: string[]): Promise<Interfaces.ITransactionData[]>;

    statistics(): Promise<{
        count: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
    }>;

    getFeeStatistics(
        days: number,
        minFeeBroadcast: number,
    ): Promise<Array<{ type: number; fee: number; timestamp: number }>>;

    deleteByBlockId(blockIds: string[], db: any): Promise<void>;

    search(parameters: ISearchParameters): Promise<ITransactionsPaginated>;
}
