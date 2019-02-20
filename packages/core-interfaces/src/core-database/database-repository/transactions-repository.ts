import { Bignum } from "@arkecosystem/crypto";
import { SearchOrderBy, SearchPaginate, SearchParameters } from "../search";
import { IRepository } from "./repository";

export interface ITransactionsRepository extends IRepository {

    /**
     * Find a transactions by its ID.
     */
    findById(id: string): Promise<any>;

    /**
     * Find multiple transactionss by their block ID.
     */
    findByBlockId(blockId: string): Promise<any[]>;

    /**
     * Find multiple transactionss by their block ID and order them by sequence.
     */
    latestByBlock(blockId: string): Promise<any[]>;

    /**
     * Find multiple transactionss by their block IDs and order them by sequence.
     */
    latestByBlocks(blockIds: string[]): Promise<any[]>;

    /**
     * Get all of the forged transaction ids from the database.
     */
    forged(ids: string[]): Promise<any[]>;

    /**
     * Get statistics about all transactions from the database.
     */
    statistics(): Promise<{
        count: number,
        totalFee: Bignum,
        totalAmount: Bignum
    }>;

    getFeeStatistics(minFeeBroadcast: number): Promise<any>;

    /**
     * Delete transactions with blockId
     */
    deleteByBlockId(blockId: string): Promise<void>;


    findAllByWallet(wallet: any, paginate?: SearchPaginate, orderBy?: SearchOrderBy[]): Promise<any>;

    findWithVendorField(): Promise<any>;

    /* TODO: Remove with v1 */
    findAll(parameters: SearchParameters): Promise<any>;

    search(parameters: SearchParameters): Promise<any>;

}
