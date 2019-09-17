import { Interfaces } from "@arkecosystem/crypto";

export interface Blockchain {
    isStopped: boolean;
    options: any;
    queue: any;

    /**
     * Create a new blockchain manager instance.
     * @param  {Object} options
     * @return {void}
     */
    init(options: { networkStart?: boolean }): this;

    /**
     * Dispatch an event to transition the state machine.
     * @param  {String} event
     * @return {void}
     */
    dispatch(event): void;

    /**
     * Start the blockchain and wait for it to be ready.
     * @return {void}
     */
    start(skipStartedCheck): Promise<boolean>;

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
    handleIncomingBlock(block: Interfaces.IBlockData, fromForger): void;

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
    processBlocks(blocks: Interfaces.IBlock[], callback): Promise<Interfaces.IBlock[]>;

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
    getBlockPing(): {
        count: number;
        first: number;
        last: number;
        block: Interfaces.IBlockData;
    };

    /**
     * Ping a block.
     */
    pingBlock(incomingBlock: Interfaces.IBlockData): boolean;

    /**
     * Push ping block.
     */
    pushPingBlock(block: Interfaces.IBlockData, fromForger): void;
}
