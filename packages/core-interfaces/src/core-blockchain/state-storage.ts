import { Interfaces } from "@arkecosystem/crypto";

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
    getLastBlock(): Interfaces.IBlock | null;

    /**
     * Sets the last block.
     * @returns {void}
     */
    setLastBlock(block: Interfaces.IBlock): void;

    /**
     * Get the last blocks.
     * @returns {Array}
     */
    getLastBlocks(): Interfaces.IBlock[];

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
    getLastBlocksByHeight(start: number, end?: number): Interfaces.IBlockData[];

    /**
     * Get common blocks for the given IDs.
     * @returns {Array}
     */
    getCommonBlocks(ids: string[]): Interfaces.IBlockData[];

    /**
     * Cache the ids of the given transactions.
     */
    cacheTransactions(
        transactions: Interfaces.ITransactionData[],
    ): { [key in "added" | "notAdded"]: Interfaces.ITransactionData[] };

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
    pingBlock(incomingBlock: Interfaces.IBlockData): boolean;

    /**
     * Push ping block
     */
    pushPingBlock(block: Interfaces.IBlockData, fromForger?: boolean): void;
}
