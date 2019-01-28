import { Bignum } from "@arkecosystem/crypto";
import { IRepository } from "./IRepository";

export interface IBlocksRepository extends IRepository {

    /**
     * Find a block by its ID.
     */
    findById(id: string): Promise<any>;

    /**
     * Count the number of records in the database.
     */
    count(): Promise<number>;

    /**
     * Get all of the common blocks from the database.
     */
    common(ids: string[]): Promise<any[]>

    /**
     * Get all of the blocks within the given height range and order them by height.
     */
    heightRange(start: number, end: number): Promise<any[]>;

    /**
     * Get the last created block from the database.
     */
    latest(): Promise<any>;

    /**
     * Get the most recently created blocks ids from the database.
     * @return {Promise}
     */
    recent(count: number): Promise<number[]>;

    /**
     * Get statistics about all blocks from the database.
     */
    statistics(): Promise<{
        numberOfTransactions: number,
        totalFee: Bignum,
        totalAmount: Bignum
    }>;

    /**
     * Get top count blocks
     */
    top(count: number): Promise<any[]>;

    /**
     * Delete the block from the database.
     */
    delete(id: string): Promise<void>;
}
