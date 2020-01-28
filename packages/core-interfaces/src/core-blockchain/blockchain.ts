import { Interfaces } from "@arkecosystem/crypto";
import { IDatabaseService } from "../core-database";
import { IPeerService } from "../core-p2p";
import { IStateStore } from "../core-state";
import { IConnection } from "../core-transaction-pool";

export interface IBlockchain {
    /**
     * Get the state of the blockchain.
     * @return {IStateStore}
     */
    readonly state: IStateStore;

    /**
     * Get the network (p2p) interface.
     */
    readonly p2p: IPeerService;

    /**
     * Get the transaction handler.
     * @return {IConnection}
     */
    readonly transactionPool: IConnection;

    /**
     * Get the database connection.
     * @return {ConnectionInterface}
     */
    readonly database: IDatabaseService;

    dispatch(event: string): void;

    /**
     * Start the blockchain and wait for it to be ready.
     * @return {void}
     */
    start(skipStartedCheck?: boolean): Promise<boolean>;

    stop(): Promise<void>;

    /**
     * Update network status.
     * @return {void}
     */
    updateNetworkStatus(): Promise<any>;

    /**
     * Clear and stop the queue.
     * @return {void}
     */
    clearAndStopQueue(): void;

    /**
     * Push a block to the process queue.
     */
    handleIncomingBlock(block: Interfaces.IBlockData, fromForger?: boolean): void;

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
    removeTopBlocks(count: any): Promise<void>;

    /**
     * Process the given blocks.
     * NOTE: We should be sure this is fail safe (ie callback() is being called only ONCE)
     * @param  {Block[]} block
     * @param  {Function} callback
     * @return {(Function|void)}
     */
    processBlocks(blocks: Interfaces.IBlockData[], callback: any): Promise<any>;

    /**
     * Called by forger to wake up and sync with the network.
     * It clears the checkLaterTimeout if set.
     * @param  {Number}  blockSize
     * @param  {Boolean} forForging
     * @return {Object}
     */
    forceWakeup(): void;

    /**
     * Fork the chain at the given block.
     * @param {Block} block
     * @returns {void}
     */
    forkBlock(block: Interfaces.IBlock): void;

    /**
     * Determine if the blockchain is synced.
     * @param  {Block} [block=getLastBlock()]  block
     * @return {Boolean}
     */
    isSynced(block?: Interfaces.IBlockData): boolean;

    /**
     * Get the last block of the blockchain.
     * @return {Object}
     */
    getLastBlock(): Interfaces.IBlock;

    /**
     * Get the last height of the blockchain.
     * @return {Object}
     */
    getLastHeight(): any;

    /**
     * Get the last downloaded block of the blockchain.
     * @return {Object}
     */
    getLastDownloadedBlock(): Interfaces.IBlockData;

    /**
     * Get the block ping.
     * @return {Object}
     */
    getBlockPing(): any;

    /**
     * Ping a block.
     * @return {Object}
     */
    pingBlock(incomingBlock: Interfaces.IBlockData): any;

    /**
     * Push ping block.
     * @return {Object}
     */
    pushPingBlock(block: Interfaces.IBlockData, fromForger?: boolean): void;

    replay(targetHeight?: number): Promise<void>;

    checkMissingBlocks(): Promise<void>;
}
