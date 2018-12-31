import { models } from "@arkecosystem/crypto";
import { TransactionPool } from "../core-transaction-pool";

export interface Blockchain {
    /**
     * Get the state of the blockchain.
     * @return {StateStorage}
     */
    readonly state: any;
    /**
     * Get the network (p2p) interface.
     * @return {P2PInterface}
     */
    readonly p2p: any;
    /**
     * Get the transaction handler.
     * @return {TransactionPool}
     */
    readonly transactionPool: TransactionPool;
    /**
     * Get the database connection.
     * @return {ConnectionInterface}
     */
    readonly database: any;

    dispatch(event: any): any;
    /**
     * Start the blockchain and wait for it to be ready.
     * @return {void}
     */
    start(skipStartedCheck?: boolean): Promise<boolean>;
    stop(): Promise<void>;
    checkNetwork(): void;
    /**
     * Update network status.
     * @return {void}
     */
    updateNetworkStatus(): Promise<any>;
    /**
     * Rebuild N blocks in the blockchain.
     * @param  {Number} nblocks
     * @return {void}
     */
    rebuild(nblocks: any): void;
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
    postTransactions(transactions: models.Transaction[]): Promise<void>;
    /**
     * Push a block to the process queue.
     * @param  {Block} block
     * @return {void}
     */
    queueBlock(block: models.Block): void;
    /**
     * Rollback all blocks up to the previous round.
     * @return {void}
     */
    rollbackCurrentRound(): Promise<void>;
    /**
     * Remove N number of blocks.
     * @param  {Number} nblocks
     * @return {void}
     */
    removeBlocks(nblocks: any): Promise<void>;
    /**
     * Remove the top blocks from database.
     * NOTE: Only used when trying to restore database integrity.
     * @param  {Number} count
     * @return {void}
     */
    removeTopBlocks(count: any): Promise<void>;
    /**
     * Hande a block during a rebuild.
     * NOTE: We should be sure this is fail safe (ie callback() is being called only ONCE)
     * @param  {Block} block
     * @param  {Function} callback
     * @return {Object}
     */
    rebuildBlock(block: any, callback: any): Promise<any>;
    /**
     * Process the given block.
     * NOTE: We should be sure this is fail safe (ie callback() is being called only ONCE)
     * @param  {Block} block
     * @param  {Function} callback
     * @return {(Function|void)}
     */
    processBlock(block: any, callback: any): Promise<any>;
    /**
     * Accept a new chained block.
     * @param  {Block} block
     * @param  {Object} state
     * @return {void}
     */
    acceptChainedBlock(block: any): Promise<void>;
    /**
     * Manage a block that is out of order.
     * @param  {Block} block
     * @param  {Object} state
     * @return {void}
     */
    manageUnchainedBlock(block: any): Promise<void>;
    /**
     * Checks if the given block contains already forged transactions.
     * @param {Block} block
     * @returns {Boolean}
     */
    checkBlockContainsForgedTransactions(block: any): Promise<boolean>;
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
    forkBlock(block: any): void;
    /**
     * Get unconfirmed transactions for the specified block size.
     * @param  {Number}  blockSize
     * @param  {Boolean} forForging
     * @return {Object}
     */
    getUnconfirmedTransactions(blockSize: any): {
        transactions: any[];
        poolSize: any;
        count: number;
    };
    /**
     * Determine if the blockchain is synced.
     * @param  {Block} [block=getLastBlock()]  block
     * @return {Boolean}
     */
    isSynced(block?: any): boolean;
    /**
     * Determine if the blockchain is synced after a rebuild.
     * @param  {Block}  block
     * @return {Boolean}
     */
    isRebuildSynced(block?: any): boolean;
    /**
     * Get the last block of the blockchain.
     * @return {Object}
     */
    getLastBlock(): any;
    /**
     * Get the last height of the blockchain.
     * @return {Object}
     */
    getLastHeight(): any;
    /**
     * Get the last downloaded block of the blockchain.
     * @return {Object}
     */
    getLastDownloadedBlock(): any;
    /**
     * Get the block ping.
     * @return {Object}
     */
    getBlockPing(): any;
    /**
     * Ping a block.
     * @return {Object}
     */
    pingBlock(incomingBlock: any): any;
    /**
     * Push ping block.
     * @return {Object}
     */
    pushPingBlock(block: any): void;
    /**
     * Get the list of events that are available.
     * @return {Array}
     */
    getEvents(): string[];
}
