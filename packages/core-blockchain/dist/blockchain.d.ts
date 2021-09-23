import { Blockchain as blockchain, Database, P2P, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import async from "async";
import { BlockProcessor } from "./processor";
export declare class Blockchain implements blockchain.IBlockchain {
    /**
     * Get the state of the blockchain.
     * @return {IStateStore}
     */
    get state(): State.IStateStore;
    /**
     * Get the network (p2p) interface.
     * @return {IPeerService}
     */
    get p2p(): P2P.IPeerService;
    /**
     * Get the transaction handler.
     * @return {TransactionPool}
     */
    get transactionPool(): TransactionPool.IConnection;
    /**
     * Get the database connection.
     * @return {ConnectionInterface}
     */
    get database(): Database.IDatabaseService;
    isStopped: boolean;
    options: any;
    queue: async.AsyncQueue<any>;
    protected blockProcessor: BlockProcessor;
    private actions;
    private missedBlocks;
    private lastCheckNetworkHealthTs;
    /**
     * Create a new blockchain manager instance.
     * @param  {Object} options
     * @return {void}
     */
    constructor(options: {
        networkStart?: boolean;
    });
    /**
     * Dispatch an event to transition the state machine.
     * @param  {String} event
     * @return {void}
     */
    dispatch(event: any): void;
    /**
     * Start the blockchain and wait for it to be ready.
     * @return {void}
     */
    start(skipStartedCheck?: boolean): Promise<boolean>;
    stop(): Promise<void>;
    /**
     * Set wakeup timeout to check the network for new blocks.
     */
    setWakeUp(): void;
    /**
     * Reset the wakeup timeout.
     */
    resetWakeUp(): void;
    /**
     * Update network status.
     * @return {void}
     */
    updateNetworkStatus(): Promise<void>;
    /**
     * Clear and stop the queue.
     * @return {void}
     */
    clearAndStopQueue(): void;
    /**
     * Clear the queue.
     * @return {void}
     */
    clearQueue(): void;
    /**
     * Push a block to the process queue.
     */
    handleIncomingBlock(block: Interfaces.IBlockData, fromForger?: boolean): void;
    /**
     * Enqueue blocks in process queue and set last downloaded block to last item in list.
     */
    enqueueBlocks(blocks: Interfaces.IBlockData[]): void;
    /**
     * Remove N number of blocks.
     * @param  {Number} nblocks
     * @return {void}
     */
    removeBlocks(nblocks: number): Promise<void>;
    /**
     * Remove the top blocks from database.
     * NOTE: Only used when trying to restore database integrity.
     * @param  {Number} count
     * @return {void}
     */
    removeTopBlocks(count: number): Promise<void>;
    /**
     * Process the given block.
     */
    processBlocks(blocks: Interfaces.IBlockData[]): Promise<Interfaces.IBlock[] | undefined>;
    /**
     * Reset the last downloaded block to last chained block.
     */
    resetLastDownloadedBlock(): void;
    /**
     * Called by forger to wake up and sync with the network.
     * It clears the wakeUpTimeout if set.
     */
    forceWakeup(): void;
    /**
     * Fork the chain at the given block.
     */
    forkBlock(block: Interfaces.IBlock, numberOfBlockToRollback?: number): void;
    /**
     * Determine if the blockchain is synced.
     */
    isSynced(block?: Interfaces.IBlockData): boolean;
    replay(targetHeight?: number): Promise<void>;
    /**
     * Get the last block of the blockchain.
     */
    getLastBlock(): Interfaces.IBlock;
    /**
     * Get the last height of the blockchain.
     */
    getLastHeight(): number;
    /**
     * Get the last downloaded block of the blockchain.
     */
    getLastDownloadedBlock(): Interfaces.IBlockData;
    /**
     * Get the block ping.
     */
    getBlockPing(): number;
    /**
     * Ping a block.
     */
    pingBlock(incomingBlock: Interfaces.IBlockData): boolean;
    /**
     * Push ping block.
     */
    pushPingBlock(block: Interfaces.IBlockData, fromForger?: boolean): void;
    /**
     * Check if the blockchain should roll back due to missing blocks.
     */
    checkMissingBlocks(): Promise<void>;
}
