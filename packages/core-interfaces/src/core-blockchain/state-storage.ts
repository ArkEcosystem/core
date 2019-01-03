import { models } from "@arkecosystem/crypto";

export interface IStateStorage {
    reset(): void;

    /**
     * Clear last blocks.
     */
    clear(): void;

    /**
     * Clear check later timeout.
     */
    clearCheckLater(): void;

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
     * Get the last blocks data.
     * @returns {Seq}
     */
    getLastBlocksData(): any;

    /**
     * Get the last block ids.
     * @returns {Array}
     */
    getLastBlockIds(): number[];

    /**
     * Get last blocks in the given height range in ascending order.
     * @param {Number} start
     * @param {Number} end
     */
    getLastBlocksByHeight(start: number, end?: number): models.Block[];

    /**
     * Get common blocks for the given IDs.
     * @returns {Array}
     */
    getCommonBlocks(ids: string[]): any;

    /**
     * Cache the ids of the given transactions.
     */
    cacheTransactions(transactions: models.Transaction[]): { [key in "added" | "notAdded"]: models.Transaction[] };

    /**
     * Remove the given transaction ids from the cache.
     */
    removeCachedTransactionIds(transactionIds: number[]): void;

    /**
     * Get cached transaction ids.
     */
    getCachedTransactionIds(): number[];

    /**
     * Ping a block.
     */
    pingBlock(incomingBlock: models.Block): boolean;

    /**
     * Push ping block
     */
    pushPingBlock(block: models.Block): void;
}
