import { Interfaces, Utils } from "@arkecosystem/crypto";
import { ITransactionsPaginated } from "../business-repository";
import { SearchOrderBy, SearchPaginate, SearchParameters } from "../search";
import { IWallet } from "../wallet-manager";
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
        paginate?: SearchPaginate,
        orderBy?: SearchOrderBy[],
    ): Promise<ITransactionsPaginated>;

    search(parameters: SearchParameters): Promise<ITransactionsPaginated>;
}
