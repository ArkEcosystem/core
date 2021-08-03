import { Interfaces } from "@arkecosystem/crypto";

import { Queue } from "../kernel/queue";
import { BlockPing } from "../state/state-store";

export interface Blockchain {
    isStopped(): boolean;

    getQueue(): Queue;

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
    boot(skipStartedCheck?: boolean): Promise<boolean>;

    isBooted(): boolean;

    dispose(): Promise<void>;

    /**
     * Set wakeup timeout to check the network for new blocks.
     */
    setWakeUp(): void;

    /**
     * Reset the wakeup timeout.
     */
    resetWakeUp(): void;

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

    enqueueBlocks(blocks: Interfaces.IBlockData[]);

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
    getBlockPing(): BlockPing | undefined;

    /**
     * Ping a block.
     */
    pingBlock(incomingBlock: Interfaces.IBlockData): boolean;

    /**
     * Push ping block.
     */
    pushPingBlock(block: Interfaces.IBlockData, fromForger): void;
}
