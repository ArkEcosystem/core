import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";
import { IWallet } from "../../core-state/wallets";
import { ITransactionsPaginated } from "../business-repository";
import { ISearchOrderBy, ISearchPaginate, ISearchParameters } from "../search";
import { IRepository } from "./repository";

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

    getAssetsByType(type: Enums.TransactionTypes | number): Promise<any>;

    getReceivedTransactions(): Promise<any>;

    getSentTransactions(): Promise<any>;

    forged(ids: string[]): Promise<Interfaces.ITransactionData[]>;

    statistics(): Promise<{
        count: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
    }>;

    getFeeStatistics(
        days: number,
        minFeeBroadcast: number,
    ): Promise<Array<{ type: number; fee: number; timestamp: number }>>;

    deleteByBlockId(blockId: string): Promise<void>;

    findAllByWallet(
        wallet: IWallet,
        paginate?: ISearchPaginate,
        orderBy?: ISearchOrderBy[],
    ): Promise<ITransactionsPaginated>;

    search(parameters: ISearchParameters): Promise<ITransactionsPaginated>;
}
