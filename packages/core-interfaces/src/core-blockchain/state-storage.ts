import { ITransactionData, models } from "@arkecosystem/crypto";

export interface IStateStorage {
    reset(): void;

    /**
     * Clear last blocks.
     */
    clear(): void;

    /**
     * Clear wakeup timeout.
     */
    clearWakeUpTimeout(): void;

    /**
     * Get the last block.
     */
    getLastBlock(): models.Block | null;

    /**
     * Sets the last block.
     * @returns {void}
     */
    setLastBlock(block: models.Block): void;

    /**
     * Get the last blocks.
     * @returns {Array}
     */
    getLastBlocks(): models.Block[];

    /**
     * Get the last block ids.
     * @returns {Array}
     */
    getLastBlockIds(): string[];

    /**
     * Get last blocks in the given height range in ascending order.
     * @param {Number} start
     * @param {Number} end
     */
    getLastBlocksByHeight(start: number, end?: number): models.IBlockData[];

    /**
     * Get common blocks for the given IDs.
     * @returns {Array}
     */
    getCommonBlocks(ids: string[]): models.IBlockData[];

    /**
     * Cache the ids of the given transactions.
     */
    cacheTransactions(transactions: ITransactionData[]): { [key in "added" | "notAdded"]: ITransactionData[] };

    /**
     * Remove the given transaction ids from the cache.
     */
    removeCachedTransactionIds(transactionIds: string[]): void;

    /**
     * Get cached transaction ids.
     */
    getCachedTransactionIds(): string[];

    /**
     * Ping a block.
     */
    pingBlock(incomingBlock: models.IBlockData): boolean;

    /**
     * Push ping block
     */
    pushPingBlock(block: models.IBlockData): void;
}
