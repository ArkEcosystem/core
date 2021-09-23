import { State } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { Seq } from "immutable";
/**
 * @TODO
 * - extract block and transaction behaviours into their respective stores
 */
export declare class StateStore implements State.IStateStore {
    blockchain: any;
    genesisBlock: Interfaces.IBlock | undefined;
    lastDownloadedBlock: Interfaces.IBlockData | undefined;
    blockPing: any;
    started: boolean;
    forkedBlock: Interfaces.IBlock | undefined;
    wakeUpTimeout: any;
    noBlockCounter: number;
    p2pUpdateCounter: number;
    numberOfBlocksToRollback: number | undefined;
    networkStart: boolean;
    private lastBlocks;
    private cachedTransactionIds;
    /**
     * Resets the state.
     * @TODO: remove the need for this method.
     */
    reset(blockchainMachine: any): void;
    /**
     * Clear last blocks.
     */
    clear(): void;
    /**
     * Clear check later timeout.
     */
    clearWakeUpTimeout(): void;
    /**
     * Get the last block height.
     */
    getLastHeight(): number;
    /**
     * Get the genesis block.
     */
    getGenesisBlock(): Interfaces.IBlock | undefined;
    /**
     * Sets the genesis block.
     */
    setGenesisBlock(block: Interfaces.IBlock): void;
    /**
     * Get the last block.
     */
    getLastBlock(): Interfaces.IBlock | undefined;
    /**
     * Sets the last block.
     */
    setLastBlock(block: Interfaces.IBlock): void;
    /**
     * Get the last blocks.
     */
    getLastBlocks(): Interfaces.IBlock[];
    /**
     * Get the last blocks data.
     */
    getLastBlocksData(headersOnly?: boolean): Seq<number, Interfaces.IBlockData>;
    /**
     * Get the last block ids.
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
     */
    getCommonBlocks(ids: string[]): Interfaces.IBlockData[];
    /**
     * Cache the ids of the given transactions.
     */
    cacheTransactions(transactions: Interfaces.ITransactionData[]): {
        added: Interfaces.ITransactionData[];
        notAdded: Interfaces.ITransactionData[];
    };
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
     * Push ping block.
     */
    pushPingBlock(block: Interfaces.IBlockData, fromForger?: boolean): void;
    private mapToBlockData;
}
