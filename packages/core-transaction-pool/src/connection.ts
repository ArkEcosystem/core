import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger, TransactionPool as transactionPool } from "@arkecosystem/core-interfaces";

import assert from "assert";
import dayjs from "dayjs-ext";
import { PoolWalletManager } from "./pool-wallet-manager";

import { Mem } from "./mem";
import { MemPoolTransaction } from "./mem-pool-transaction";
import { Storage } from "./storage";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger = app.resolvePlugin<Logger.ILogger>("logger");

/**
 * Transaction pool. It uses a hybrid storage - caching the data
 * in memory and occasionally saving it to a persistent, on-disk storage (SQLite),
 * every N modifications, and also during shutdown. The operations that only read
 * data (everything other than add or remove transaction) are served from the
 * in-memory storage.
 */
export class TransactionPool implements transactionPool.ITransactionPool {
    public walletManager: any;
    public blockedByPublicKey: any;
    public mem: any;
    public storage: any;
    public loggedAllowedSenders: any[];

    /**
     * Create a new transaction pool instance.
     * @param  {Object} options
     */
    constructor(public options) {
        this.walletManager = new PoolWalletManager();
        this.blockedByPublicKey = {};
    }
    /**
     * Make the transaction pool instance. Load all transactions in the pool from
     * the on-disk database, saved there from a previous run.
     * @return {TransactionPool}
     */
    public async make() {
        this.mem = new Mem();
        this.storage = new Storage(this.options.storage);
        this.loggedAllowedSenders = [];

        const all = this.storage.loadAll();
        all.forEach(t => this.mem.add(t, this.options.maxTransactionAge, true));

        this.__purgeExpired();

        // Remove transactions that were forged while we were offline.
        const allIds = all.map(memPoolTransaction => memPoolTransaction.transaction.id);

        const forgedIds = await databaseService.getForgedTransactionsIds(allIds);

        forgedIds.forEach(id => this.removeTransactionById(id));

        return this;
    }

    /**
     * Get a driver instance.
     * @return {TransactionPoolInterface}
     */
    public driver() {
        return this.driver;
    }

    /**
     * Disconnect from transaction pool.
     * @return {void}
     */
    public disconnect() {
        this.__syncToPersistentStorage();
        this.storage.close();
    }

    /**
     * Get all transactions of a given type from the pool.
     * @param {Number} type of transaction
     * @return {Set of MemPoolTransaction} all transactions of the given type, could be empty Set
     */
    public getTransactionsByType(type) {
        this.__purgeExpired();

        return this.mem.getByType(type);
    }

    /**
     * Get the number of transactions in the pool.
     * @return {Number}
     */
    public getPoolSize() {
        this.__purgeExpired();

        return this.mem.getSize();
    }

    /**
     * Get the number of transactions in the pool from a specific sender
     * @param {String} senderPublicKey
     * @returns {Number}
     */
    public getSenderSize(senderPublicKey) {
        this.__purgeExpired();

        return this.mem.getBySender(senderPublicKey).size;
    }

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
    public addTransactions(transactions) {
        const added = [];
        const notAdded = [];

        for (const t of transactions) {
            const result = this.addTransaction(t);

            if (result.success) {
                added.push(t);
            } else {
                notAdded.push(result);
            }
        }

        return { added, notAdded };
    }

    /**
     * Add a transaction to the pool.
     * @param {Transaction} transaction
     * @return {Object} The success property indicates wether the transaction was successfully added
     * and applied to the pool or not. In case it was not successful, the type and message
     * property yield information about the error.
     */
    public addTransaction(transaction) {
        if (this.transactionExists(transaction.id)) {
            logger.debug(
                "Transaction pool: ignoring attempt to add a transaction that is already " +
                    `in the pool, id: ${transaction.id}`,
            );

            return this.__createError(transaction, "ERR_ALREADY_IN_POOL", "Already in pool");
        }

        const poolSize = this.mem.getSize();

        if (this.options.maxTransactionsInPool <= poolSize) {
            // The pool can't accommodate more transactions. Either decline the newcomer or remove
            // an existing transaction from the pool in order to free up space.
            const all = this.mem.getTransactionsOrderedByFee();
            const lowest = all[all.length - 1].transaction;

            if (lowest.fee.isLessThan(transaction.fee)) {
                this.walletManager.revertTransactionForSender(lowest);
                this.mem.remove(lowest.id, lowest.senderPublicKey);
            } else {
                return this.__createError(
                    transaction,
                    "ERR_POOL_FULL",
                    `Pool is full (has ${poolSize} transactions) and this transaction's fee ` +
                        `${transaction.fee.toFixed()} is not higher than the lowest fee already in pool ` +
                        `${lowest.fee.toFixed()}`,
                );
            }
        }

        this.mem.add(new MemPoolTransaction(transaction), this.options.maxTransactionAge);

        // Apply transaction to pool wallet manager.
        const senderWallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);

        const errors = [];
        if (this.walletManager.canApply(transaction.data, errors)) {
            senderWallet.applyTransactionToSender(transaction);
        } else {
            // Remove tx again from the pool
            this.mem.remove(transaction.id);

            return this.__createError(transaction, "ERR_APPLY", JSON.stringify(errors));
        }

        this.__syncToPersistentStorageIfNecessary();
        return { success: true };
    }

    /**
     * Remove a transaction from the pool by transaction object.
     * @param  {Transaction} transaction
     * @return {void}
     */
    public removeTransaction(transaction) {
        this.removeTransactionById(transaction.id, transaction.senderPublicKey);
    }

    /**
     * Remove a transaction from the pool by id.
     * @param  {String} id
     * @param  {String} senderPublicKey
     * @return {void}
     */
    public removeTransactionById(id, senderPublicKey?) {
        this.mem.remove(id, senderPublicKey);

        this.__syncToPersistentStorageIfNecessary();
    }

    /**
     * Get all transactions that are ready to be forged.
     * @param  {Number} blockSize
     * @return {(Array|void)}
     */
    public getTransactionsForForging(blockSize) {
        return this.getTransactions(0, blockSize, this.options.maxTransactionBytes);
    }

    /**
     * Get a transaction by transaction id.
     * @param  {String} id
     * @return {(Transaction|undefined)}
     */
    public getTransaction(id) {
        this.__purgeExpired();

        return this.mem.getTransactionById(id);
    }

    /**
     * Get all transactions within the specified range [start, start + size), ordered by fee.
     * @param  {Number} start
     * @param  {Number} size
     * @param  {Number} maxBytes for the total transaction array or 0 for no limit
     * @return {(Array|void)} array of serialized transaction hex strings
     */
    public getTransactions(start, size, maxBytes?: number) {
        return this.getTransactionsData(start, size, "serialized", maxBytes);
    }

    /**
     * Get all transactions within the specified range [start, start + size).
     * @param  {Number} start
     * @param  {Number} size
     * @return {Array} array of transactions IDs in the specified range
     */
    public getTransactionIdsForForging(start, size) {
        return this.getTransactionsData(start, size, "id", this.options.maxTransactionBytes);
    }

    /**
     * Get data from all transactions within the specified range [start, start + size).
     * Transactions are ordered by fee (highest fee first) or by
     * insertion time, if fees equal (earliest transaction first).
     * @param  {Number} start
     * @param  {Number} size
     * @param  {Number} maxBytes for the total transaction array or 0 for no limit
     * @param  {String} property
     * @return {Array} array of transaction[property]
     */
    public getTransactionsData(start, size, property, maxBytes = 0) {
        this.__purgeExpired();

        const data = [];

        let transactionBytes = 0;

        let i = 0;
        for (const memPoolTransaction of this.mem.getTransactionsOrderedByFee()) {
            if (i >= start + size) {
                break;
            }

            if (i >= start) {
                let pushTransaction = false;
                assert.notStrictEqual(memPoolTransaction.transaction[property], undefined);
                if (maxBytes > 0) {
                    // Only add the transaction if it will not make the total payload size exceed the maximum
                    const transactionSize = JSON.stringify(memPoolTransaction.transaction.data).length;
                    if (transactionBytes + transactionSize <= maxBytes) {
                        transactionBytes += transactionSize;
                        pushTransaction = true;
                    }
                } else {
                    pushTransaction = true;
                }
                if (pushTransaction) {
                    data.push(memPoolTransaction.transaction[property]);
                    i++;
                }
            } else {
                i++;
            }
        }

        return data;
    }

    /**
     * Remove all transactions from the transaction pool belonging to specific sender.
     * @param  {String} senderPublicKey
     * @return {void}
     */
    public removeTransactionsForSender(senderPublicKey) {
        this.mem.getBySender(senderPublicKey).forEach(e => this.removeTransactionById(e.transaction.id));
    }

    /**
     * Check whether sender of transaction has exceeded max transactions in queue.
     * @param  {Transaction} transaction
     * @return {Boolean} true if exceeded
     */
    public hasExceededMaxTransactions(transaction) {
        this.__purgeExpired();

        if (this.options.allowedSenders.includes(transaction.senderPublicKey)) {
            if (!this.loggedAllowedSenders.includes(transaction.senderPublicKey)) {
                logger.debug(
                    `Transaction pool: allowing sender public key: ${
                        transaction.senderPublicKey
                    } (listed in options.allowedSenders), thus skipping throttling.`,
                );
                this.loggedAllowedSenders.push(transaction.senderPublicKey);
            }

            return false;
        }

        const count = this.mem.getBySender(transaction.senderPublicKey).size;

        return !(count <= this.options.maxTransactionsPerSender);
    }

    /**
     * Flush the pool (delete all transactions from it).
     * @return {void}
     */
    public flush() {
        this.mem.flush();

        this.storage.deleteAll();
    }

    /**
     * Checks if a transaction exists in the pool.
     * @param  {String} transactionId
     * @return {Boolean}
     */
    public transactionExists(transactionId) {
        if (!this.mem.transactionExists(transactionId)) {
            // If it does not exist then no need to purge expired transactions because
            // we know it will not exist after purge too.
            return false;
        }

        this.__purgeExpired();

        return this.mem.transactionExists(transactionId);
    }

    /**
     * Check if transaction sender is blocked
     * @param  {String} senderPublicKey
     * @return {Boolean}
     */
    public isSenderBlocked(senderPublicKey) {
        if (!this.blockedByPublicKey[senderPublicKey]) {
            return false;
        }

        if (this.blockedByPublicKey[senderPublicKey] < dayjs()) {
            delete this.blockedByPublicKey[senderPublicKey];
            return false;
        }

        return true;
    }

    /**
     * Blocks sender for a specified time
     * @param  {String} senderPublicKey
     * @return {Time} blockReleaseTime
     */
    public blockSender(senderPublicKey) {
        const blockReleaseTime = dayjs().add(1, "hour");

        this.blockedByPublicKey[senderPublicKey] = blockReleaseTime;

        logger.warn(`Sender ${senderPublicKey} blocked until ${this.blockedByPublicKey[senderPublicKey]} :stopwatch:`);

        return blockReleaseTime;
    }

    /**
     * Processes recently accepted block by the blockchain.
     * It removes block transaction from the pool and adjusts
     * pool wallets for non existing transactions.
     *
     * @param  {Object} block
     * @return {void}
     */
    public acceptChainedBlock(block) {
        for (const { data } of block.transactions) {
            const exists = this.transactionExists(data.id);
            const senderPublicKey = data.senderPublicKey;

            const senderWallet = this.walletManager.exists(senderPublicKey)
                ? this.walletManager.findByPublicKey(senderPublicKey)
                : false;

            const recipientWallet = this.walletManager.exists(data.recipientId)
                ? this.walletManager.findByAddress(data.recipientId)
                : false;

            if (recipientWallet) {
                recipientWallet.applyTransactionToRecipient(data);
            }

            if (exists) {
                this.removeTransaction(data);
            } else if (senderWallet) {
                const errors = [];
                if (senderWallet.canApply(data, errors)) {
                    senderWallet.applyTransactionToSender(data);
                } else {
                    this.purgeByPublicKey(data.senderPublicKey);
                    this.blockSender(data.senderPublicKey);

                    logger.error(
                        `CanApply transaction test failed on acceptChainedBlock() in transaction pool for transaction id:${
                            data.id
                        } due to ${JSON.stringify(errors)}. Possible double spending attack :bomb:`,
                    );
                }
            }

            if (
                senderWallet &&
                this.walletManager.canBePurged(senderWallet) &&
                this.getSenderSize(senderPublicKey) === 0
            ) {
                this.walletManager.deleteWallet(senderPublicKey);
            }
        }

        // if delegate in poll wallet manager - apply rewards and fees
        if (this.walletManager.exists(block.data.generatorPublicKey)) {
            const delegateWallet = this.walletManager.findByPublicKey(block.data.generatorPublicKey);
            const increase = block.data.reward.plus(block.data.totalFee);
            delegateWallet.balance = delegateWallet.balance.plus(increase);
        }

        app.resolve("state").removeCachedTransactionIds(block.transactions.map(tx => tx.id));
    }

    /**
     * Rebuild pool manager wallets
     * Removes all the wallets from pool manager and applies transaction from pool - if any
     * It waits for the node to sync, and then check the transactions in pool
     * and validates them and apply to the pool manager.
     * @return {void}
     */
    public async buildWallets() {
        this.walletManager.reset();
        const poolTransactionIds = await this.getTransactionIdsForForging(0, this.getPoolSize());

        app.resolve("state").removeCachedTransactionIds(poolTransactionIds);

        poolTransactionIds.forEach(transactionId => {
            const transaction = this.getTransaction(transactionId);
            if (!transaction) {
                return;
            }

            const senderWallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            const errors = [];
            if (senderWallet && senderWallet.canApply(transaction, errors)) {
                senderWallet.applyTransactionToSender(transaction);
            } else {
                logger.error(`BuildWallets from pool: ${JSON.stringify(errors)}`);
                this.purgeByPublicKey(transaction.senderPublicKey);
            }
        });
        logger.info("Transaction Pool Manager build wallets complete");
    }

    public purgeByPublicKey(senderPublicKey) {
        logger.debug(`Purging sender: ${senderPublicKey} from pool wallet manager`);

        this.removeTransactionsForSender(senderPublicKey);

        this.walletManager.deleteWallet(senderPublicKey);
    }

    /**
     * Purges all transactions from senders with at least one
     * invalid transaction.
     * @param {Block} block
     */
    public purgeSendersWithInvalidTransactions(block) {
        const publicKeys = new Set(block.transactions.filter(tx => !tx.verified).map(tx => tx.senderPublicKey));

        publicKeys.forEach(publicKey => this.purgeByPublicKey(publicKey));
    }

    /**
     * Purges all transactions from the block.
     * Purges if transaction exists. It assumes that if trx exists that also wallet exists in pool
     * @param {Block} block
     */
    public purgeBlock(block) {
        block.transactions.forEach(tx => {
            if (this.transactionExists(tx.id)) {
                this.removeTransaction(tx);
                this.walletManager.findByPublicKey(tx.senderPublicKey).revertTransactionForSender(tx);
            }
        });
    }

    /**
     * Check whether a given sender has any transactions of the specified type
     * in the pool.
     * @param {String} senderPublicKey public key of the sender
     * @param {Number} transactionType transaction type, must be one of
     * TransactionTypes.* and is compared against transaction.type.
     * @return {Boolean} true if exist
     */
    public senderHasTransactionsOfType(senderPublicKey, transactionType) {
        this.__purgeExpired();

        for (const memPoolTransaction of this.mem.getBySender(senderPublicKey)) {
            if (memPoolTransaction.transaction.type === transactionType) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sync the in-memory storage to the persistent (on-disk) storage if too
     * many changes have been accumulated in-memory.
     * @return {void}
     */
    public __syncToPersistentStorageIfNecessary() {
        if (this.options.syncInterval <= this.mem.getNumberOfDirty()) {
            this.__syncToPersistentStorage();
        }
    }

    /**
     * Sync the in-memory storage to the persistent (on-disk) storage.
     */
    public __syncToPersistentStorage() {
        const added = this.mem.getDirtyAddedAndForget();
        this.storage.bulkAdd(added);

        const removed = this.mem.getDirtyRemovedAndForget();
        this.storage.bulkRemoveById(removed);
    }

    /**
     * Create an error object which the TransactionGuard understands.
     * @param {Transaction} transaction
     * @param {String} type
     * @param {String} message
     * @return {Object}
     */
    public __createError(transaction, type, message) {
        return {
            transaction,
            type,
            message,
            success: false,
        };
    }

    /**
     * Remove all transactions from the pool that have expired.
     * @return {void}
     */
    private __purgeExpired() {
        for (const transaction of this.mem.getExpired(this.options.maxTransactionAge)) {
            emitter.emit("transaction.expired", transaction.data);

            this.walletManager.revertTransactionForSender(transaction);
            this.mem.remove(transaction.id, transaction.senderPublicKey);
            this.__syncToPersistentStorageIfNecessary();
        }
    }
}
