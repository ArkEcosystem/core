import { blocks, interfaces, Transaction } from "@arkecosystem/crypto";
import { IDatabaseService } from "../core-database";
import { IPeerService } from "../core-p2p";
import { IConnection } from "../core-transaction-pool";
import { IStateStorage } from "./state-storage";

export interface IBlockchain {
    /**
     * Get the state of the blockchain.
     * @return {IStateStorage}
     */
    readonly state: IStateStorage;

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
     * Reset the state of the blockchain.
     * @return {void}
     */
    resetState(): void;

    /**
     * Clear and stop the queue.
     * @return {void}
     */
    clearAndStopQueue(): void;

    /**
     * Hand the given transactions to the transaction handler.
     * @param  {Array}   transactions
     * @return {void}
     */
    postTransactions(transactions: Transaction[]): Promise<void>;

    /**
     * Push a block to the process queue.
     * @param  {Block} block
     * @return {void}
     */
    handleIncomingBlock(block: blocks.Block): void;

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
     * Process the given block.
     * NOTE: We should be sure this is fail safe (ie callback() is being called only ONCE)
     * @param  {Block} block
     * @param  {Function} callback
     * @return {(Function|void)}
     */
    processBlock(block: blocks.Block, callback: any): Promise<any>;

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
    forkBlock(block: blocks.Block): void;

    /**
     * Get unconfirmed transactions for the specified block size.
     * @param  {Number}  blockSize
     * @param  {Boolean} forForging
     * @return {Object}
     */
    getUnconfirmedTransactions(
        blockSize: number,
    ): {
        transactions: string[];
        poolSize: number;
        count: number;
    };

    /**
     * Determine if the blockchain is synced.
     * @param  {Block} [block=getLastBlock()]  block
     * @return {Boolean}
     */
    isSynced(block?: blocks.Block): boolean;

    /**
     * Get the last block of the blockchain.
     * @return {Object}
     */
    getLastBlock(): blocks.Block;

    /**
     * Get the last height of the blockchain.
     * @return {Object}
     */
    getLastHeight(): any;

    /**
     * Get the last downloaded block of the blockchain.
     * @return {Object}
     */
    getLastDownloadedBlock(): { data: interfaces.IBlockData };

    /**
     * Get the block ping.
     * @return {Object}
     */
    getBlockPing(): any;

    /**
     * Ping a block.
     * @return {Object}
     */
    pingBlock(incomingBlock: interfaces.IBlockData): any;

    /**
     * Push ping block.
     * @return {Object}
     */
    pushPingBlock(block: interfaces.IBlockData): void;
}
