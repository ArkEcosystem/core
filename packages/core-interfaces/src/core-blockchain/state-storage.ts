import { blocks, interfaces } from "@arkecosystem/crypto";

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
    getLastBlock(): blocks.Block | null;

    /**
     * Sets the last block.
     * @returns {void}
     */
    setLastBlock(block: blocks.Block): void;

    /**
     * Get the last blocks.
     * @returns {Array}
     */
    getLastBlocks(): blocks.Block[];

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
    getLastBlocksByHeight(start: number, end?: number): interfaces.IBlockData[];

    /**
     * Get common blocks for the given IDs.
     * @returns {Array}
     */
    getCommonBlocks(ids: string[]): interfaces.IBlockData[];

    /**
     * Cache the ids of the given transactions.
     */
    cacheTransactions(
        transactions: interfaces.ITransactionData[],
    ): { [key in "added" | "notAdded"]: interfaces.ITransactionData[] };

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
    pingBlock(incomingBlock: interfaces.IBlockData): boolean;

    /**
     * Push ping block
     */
    pushPingBlock(block: interfaces.IBlockData): void;
}
