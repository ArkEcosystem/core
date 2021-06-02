import { Interfaces } from "@arkecosystem/crypto";

export interface BlockPing {
    count: number;
    first: number;
    last: number;
    fromForger: boolean;
    block: Interfaces.IBlockData;
}

export interface StateStore {
    getBlockchain(): any;

    setBlockchain(blockchain: any): void;

    /**
     * Get the genesis block.
     */
    getGenesisBlock(): Interfaces.IBlock;

    /**
     * Sets the genesis block.
     * @returns {void}
     */
    setGenesisBlock(block: Interfaces.IBlock): void;

    getLastDownloadedBlock(): Interfaces.IBlockData | undefined;

    setLastDownloadedBlock(block: Interfaces.IBlockData): void;

    getLastStoredBlockHeight(): number;

    setLastStoredBlockHeight(height: number): void;

    getBlockPing(): BlockPing | undefined;

    isStarted(): boolean;

    setStarted(started: boolean): void;

    getForkedBlock(): Interfaces.IBlock | undefined;

    setForkedBlock(block: Interfaces.IBlock): void;

    clearForkedBlock(): void;

    getNoBlockCounter(): number;

    setNoBlockCounter(noBlockCounter: number): void;

    getP2pUpdateCounter(): number;

    setP2pUpdateCounter(p2pUpdateCounter: number): void;

    getNumberOfBlocksToRollback(): number;

    setNumberOfBlocksToRollback(numberOfBlocksToRollback: number): void;

    getNetworkStart(): boolean;

    setNetworkStart(networkStart: boolean): void;

    getRestoredDatabaseIntegrity(): boolean;

    setRestoredDatabaseIntegrity(restoredDatabaseIntegrity: boolean): void;

    reset(blockchainMachine): void;

    /**
     * Is wakeup timeout set.
     */
    isWakeUpTimeoutSet(): boolean;

    /**
     * Set wakeup timeout.
     */
    setWakeUpTimeout(callback: Function, timeout: number): void;

    /**
     * Clear wakeup timeout.
     */
    clearWakeUpTimeout(): void;

    /**
     * Get block storage limit.
     */
    getMaxLastBlocks(): number;

    /**
     * Get the last block height.
     */
    getLastHeight(): number;

    /**
     * Get the last block.
     */
    getLastBlock(): Interfaces.IBlock;

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
    getLastBlocksByHeight(start: number, end?: number, headersOnly?: boolean): Interfaces.IBlockData[];

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
    pingBlock(incomingBlock: Interfaces.IBlockData): boolean;

    /**
     * Push ping block
     */
    pushPingBlock(block: Interfaces.IBlockData, fromForger?: boolean): void;
}
