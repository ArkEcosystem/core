import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { Interfaces } from "@arkecosystem/crypto";

export interface StateStore {
    blockchain: any;
    lastDownloadedBlock: BlockInterfaces.IBlockData | undefined;
    blockPing: any;
    started: boolean;
    forkedBlock: BlockInterfaces.IBlock | undefined;
    wakeUpTimeout: any;
    noBlockCounter: number;
    p2pUpdateCounter: number;
    numberOfBlocksToRollback: number | undefined;
    networkStart: boolean;

    reset(blockchainMachine): void;

    /**
     * Clear last blocks.
     */
    clear(): void;

    /**
     * Clear wakeup timeout.
     */
    clearWakeUpTimeout(): void;

    /**
     * Get the last block height.
     */
    getLastHeight(): number;

    /**
     * Get the genesis block.
     */
    getGenesisBlock(): BlockInterfaces.IBlock;

    /**
     * Sets the genesis block.
     * @returns {void}
     */
    setGenesisBlock(block: BlockInterfaces.IBlock): void;

    /**
     * Get the last block.
     */
    getLastBlock(): BlockInterfaces.IBlock;

    /**
     * Sets the last block.
     * @returns {void}
     */
    setLastBlock(block: BlockInterfaces.IBlock): void;

    /**
     * Get the last blocks.
     * @returns {Array}
     */
    getLastBlocks(): BlockInterfaces.IBlock[];

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
    getLastBlocksByHeight(start: number, end?: number, headersOnly?: boolean): BlockInterfaces.IBlockData[];

    /**
     * Get common blocks for the given IDs.
     * @returns {Array}
     */
    getCommonBlocks(ids: string[]): BlockInterfaces.IBlockData[];

    /**
     * Cache the ids of the given transactions.
     */
    cacheTransactions(
        transactions: Interfaces.ITransactionData[],
    ): { [key in "added" | "notAdded"]: Interfaces.ITransactionData[] };

    /**
     * Drop all cached transaction ids.
     */
    clearCachedTransactionIds(): void;

    /**
     * Get cached transaction ids.
     */
    getCachedTransactionIds(): string[];

    /**
     * Ping a block.
     */
    pingBlock(incomingBlock: BlockInterfaces.IBlockData): boolean;

    /**
     * Push ping block
     */
    pushPingBlock(block: BlockInterfaces.IBlockData, fromForger?: boolean): void;
}
