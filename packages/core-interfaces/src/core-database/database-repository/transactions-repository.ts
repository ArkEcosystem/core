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
            serialized: string;
        }>
    >;

    latestByBlock(
        blockId: string,
    ): Promise<
        Array<{
            id: string;
            serialized: string;
        }>
    >;

    latestByBlocks(
        blockIds: string[],
    ): Promise<
        Array<{
            id: string;
            block_id: string;
            serialized: string;
        }>
    >;

    forged(ids: string[]): Promise<string[]>;

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

    /* TODO: Remove with v1 */
    findAll(parameters: SearchParameters): Promise<ITransactionsPaginated>;

    search(parameters: SearchParameters): Promise<ITransactionsPaginated>;
}
