import dayjs from "dayjs-ext";

import { constants, models } from "@arkecosystem/crypto";

export interface IAddTransactionResponse {
    success: boolean;
}
export interface IAddTransactionErrorResponse extends IAddTransactionResponse {
    transaction: models.Transaction;
    type: string;
    message: string;
    success: boolean;
}

export interface ITransactionPool {
    options: any;

    make(): Promise<this>;

    /**
     * Get a driver instance.
     */
    driver(): () => any;

    /**
     * Disconnect from transaction pool.
     * @return {void}
     */
    disconnect(): void;

    /**
     * Get the number of transactions in the pool.
     */
    getPoolSize(): number;

    /**
     * Get the number of transactions in the pool from a specific sender\
     */
    getSenderSize(senderPublicKey: string): number;

    /**
     * Add many transactions to the pool.
     * @param {Array}   transactions, already transformed and verified
     * by transaction guard - must have serialized field
     * @return {Object} like
     * {
     *   added: [ ... successfully added transactions ... ],
     *   notAdded: [ { transaction: Transaction, type: String, message: String }, ... ]
     * }
     */
    addTransactions(
        transactions: models.Transaction[],
    ): {
        added: models.Transaction[];
        notAdded: IAddTransactionErrorResponse[];
    };

    /**
     * Add a transaction to the pool.
     */
    addTransaction(transaction: models.Transaction): IAddTransactionResponse;

    /**
     * Remove a transaction from the pool by transaction object.
     * @param  {Transaction} transaction
     * @return {void}
     */
    removeTransaction(transaction: models.Transaction): void;

    /**
     * Remove a transaction from the pool by id.
     */
    removeTransactionById(id: string, senderPublicKey?: string): void;

    /**
     * Get all transactions that are ready to be forged.
     */
    getTransactionsForForging(blockSize: number): string[];

    /**
     * Get a transaction by transaction id.
     */
    getTransaction(id: string): models.Transaction;

    /**
     * Get all transactions within the specified range [start, start + size), ordered by fee.
     * @return {(Array|void)} array of serialized transaction hex strings
     */
    getTransactions(start: number, size: number, maxBytes?: number): Buffer[];

    /**
     * Get all transactions within the specified range [start, start + size).
     * @return {Array} array of transactions IDs in the specified range
     */
    getTransactionIdsForForging(start: number, size: number): string[];

    /**
     * Get data from all transactions within the specified range [start, start + size).
     * Transactions are ordered by fee (highest fee first) or by
     * insertion time, if fees equal (earliest transaction first).
     * @return {Array} array of transaction[property]
     */
    getTransactionsData(start: number, size: number, property: string, maxBytes?: number): string[] | Buffer[];

    /**
     * Remove all transactions from the transaction pool belonging to specific sender.
     */
    removeTransactionsForSender(senderPublicKey: string): void;

    /**
     * Check whether sender of transaction has exceeded max transactions in queue.
     */
    hasExceededMaxTransactions(transaction: models.ITransactionData): boolean;

    /**
     * Flush the pool (delete all transactions from it).
     */
    flush(): void;

    /**
     * Checks if a transaction exists in the pool.
     */
    transactionExists(transactionId: string): any;

    /**
     * Check if transaction sender is blocked
     * @return {Boolean}
     */
    isSenderBlocked(senderPublicKey: string): boolean;

    /**
     * Blocks sender for a specified time
     */
    blockSender(senderPublicKey: string): dayjs.Dayjs;

    /**
     * Processes recently accepted block by the blockchain.
     * It removes block transaction from the pool and adjusts
     * pool wallets for non existing transactions.
     *
     * @param  {Object} block
     * @return {void}
     */
    acceptChainedBlock(block: models.Block): void;

    /**
     * Rebuild pool manager wallets
     * Removes all the wallets from pool manager and applies transaction from pool - if any
     * It waits for the node to sync, and then check the transactions in pool
     * and validates them and apply to the pool manager.
     */
    buildWallets(): Promise<void>;

    purgeByPublicKey(senderPublicKey: string): void;

    /**
     * Purges all transactions from senders with at least one
     * invalid transaction.
     */
    purgeSendersWithInvalidTransactions(block: models.Block): void;

    /**
     * Purges all transactions from the block.
     * Purges if transaction exists. It assumes that if trx exists that also wallet exists in pool
     */
    purgeBlock(block: models.Block): void;

    /**
     * Check whether a given sender has any transactions of the specified type
     * in the pool.
     */
    senderHasTransactionsOfType(senderPublicKey: string, transactionType: constants.TransactionTypes): boolean;
}
