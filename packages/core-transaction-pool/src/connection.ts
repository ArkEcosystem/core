import { app } from "@arkecosystem/core-container";
import {
    Blockchain,
    Database,
    EventEmitter,
    Logger,
    TransactionPool as transactionPool,
} from "@arkecosystem/core-interfaces";
import { TransactionServiceRegistry } from "@arkecosystem/core-transactions";

import { dato, Dato } from "@faustbrian/dato";
import assert from "assert";
import { PoolWalletManager } from "./pool-wallet-manager";

import { Bignum, constants, ITransactionData, models, Transaction } from "@arkecosystem/crypto";
import { Mem } from "./mem";
import { MemPoolTransaction } from "./mem-pool-transaction";
import { Storage } from "./storage";

/**
 * Transaction pool. It uses a hybrid storage - caching the data
 * in memory and occasionally saving it to a persistent, on-disk storage (SQLite),
 * every N modifications, and also during shutdown. The operations that only read
 * data (everything other than add or remove transaction) are served from the
 * in-memory storage.
 */
export class TransactionPool implements transactionPool.ITransactionPool {
    public walletManager: PoolWalletManager;
    public mem: Mem;
    public storage: Storage;
    public loggedAllowedSenders: string[];
    private blockedByPublicKey: { [key: string]: Dato };

    private readonly databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    private readonly emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
    private readonly logger = app.resolvePlugin<Logger.ILogger>("logger");

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
    public async make(): Promise<this> {
        this.mem = new Mem();
        this.storage = new Storage(this.options.storage);
        this.loggedAllowedSenders = [];

        const all = this.storage.loadAll();
        all.forEach(t => this.mem.add(t, this.options.maxTransactionAge, true));

        this.__purgeExpired();

        // Remove transactions that were forged while we were offline.
        const allIds = all.map(memPoolTransaction => memPoolTransaction.transaction.id);

        const forgedIds = await this.databaseService.getForgedTransactionsIds(allIds);

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
     */
    public getPoolSize(): number {
        this.__purgeExpired();

        return this.mem.getSize();
    }

    /**
     * Get the number of transactions in the pool from a specific sender
     */
    public getSenderSize(senderPublicKey: string): number {
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
    public addTransactions(transactions: Transaction[]) {
        const added = [];
        const notAdded = [];

        for (const transaction of transactions) {
            const result = this.addTransaction(transaction);

            if (result.success) {
                added.push(transaction);
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
    public addTransaction(transaction: Transaction): transactionPool.IAddTransactionResponse {
        if (this.transactionExists(transaction.id)) {
            this.logger.debug(
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

            const fee = transaction.data.fee as Bignum;
            const lowestFee = lowest.data.fee as Bignum;

            if (lowestFee.isLessThan(fee)) {
                this.walletManager.revertTransactionForSender(lowest);
                this.mem.remove(lowest.id, lowest.data.senderPublicKey);
            } else {
                return this.__createError(
                    transaction,
                    "ERR_POOL_FULL",
                    `Pool is full (has ${poolSize} transactions) and this transaction's fee ` +
                    `${fee.toFixed()} is not higher than the lowest fee already in pool ` +
                    `${lowestFee.toFixed()}`,
                );
            }
        }

        this.mem.add(new MemPoolTransaction(transaction), this.options.maxTransactionAge);

        // Apply transaction to pool wallet manager.
        const senderWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);

        // TODO: rework error handling
        const errors = [];
        if (this.walletManager.canApply(transaction, errors)) {
            const transactionService = TransactionServiceRegistry.get(transaction.type);
            transactionService.applyToSender(transaction, senderWallet);
        } else {
            // Remove tx again from the pool
            this.mem.remove(transaction.id);
            return this.__createError(transaction, "ERR_APPLY", JSON.stringify(errors));
        }

        this.__syncToPersistentStorageIfNecessary();
        return { success: true };
    }

    /**
     * Remove a transaction from the pool by transaction.
     */
    public removeTransaction(transaction: Transaction) {
        this.removeTransactionById(transaction.id, transaction.data.senderPublicKey);
    }

    /**
     * Remove a transaction from the pool by id.
     */
    public removeTransactionById(id: string, senderPublicKey?: string) {
        this.mem.remove(id, senderPublicKey);

        this.__syncToPersistentStorageIfNecessary();
    }

    /**
     * Get all transactions that are ready to be forged.
     */
    public getTransactionsForForging(blockSize: number): string[] {
        return this.getTransactions(0, blockSize, this.options.maxTransactionBytes).map(tx => tx.toString("hex"));
    }

    /**
     * Get a transaction by transaction id.
     */
    public getTransaction(id: string): Transaction {
        this.__purgeExpired();

        return this.mem.getTransactionById(id);
    }

    /**
     * Get all transactions within the specified range [start, start + size), ordered by fee.
     */
    public getTransactions(start: number, size: number, maxBytes?: number): Buffer[] {
        return this.getTransactionsData(start, size, "serialized", maxBytes) as Buffer[];
    }

    /**
     * Get all transactions within the specified range [start, start + size).
     */
    public getTransactionIdsForForging(start: number, size: number): string[] {
        return this.getTransactionsData(start, size, "id", this.options.maxTransactionBytes) as string[];
    }

    /**
     * Get data from all transactions within the specified range [start, start + size).
     * Transactions are ordered by fee (highest fee first) or by
     * insertion time, if fees equal (earliest transaction first).
     */
    public getTransactionsData(start: number, size: number, property: string, maxBytes = 0): string[] | Buffer[] {
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
     */
    public removeTransactionsForSender(senderPublicKey: string) {
        this.mem.getBySender(senderPublicKey).forEach(e => this.removeTransactionById(e.transaction.id));
    }

    /**
     * Check whether sender of transaction has exceeded max transactions in queue.
     */
    public hasExceededMaxTransactions(transaction: ITransactionData): boolean {
        this.__purgeExpired();

        if (this.options.allowedSenders.includes(transaction.senderPublicKey)) {
            if (!this.loggedAllowedSenders.includes(transaction.senderPublicKey)) {
                this.logger.debug(
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
     */
    public flush() {
        this.mem.flush();

        this.storage.deleteAll();
    }

    /**
     * Checks if a transaction exists in the pool.
     */
    public transactionExists(transactionId: string): boolean {
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
     */
    public isSenderBlocked(senderPublicKey: string): boolean {
        if (!this.blockedByPublicKey[senderPublicKey]) {
            return false;
        }

        if (dato().isAfter(this.blockedByPublicKey[senderPublicKey])) {
            delete this.blockedByPublicKey[senderPublicKey];
            return false;
        }

        return true;
    }

    /**
     * Blocks sender for a specified time
     */
    public blockSender(senderPublicKey: string): Dato {
        const blockReleaseTime = dato().addHours(1);

        this.blockedByPublicKey[senderPublicKey] = blockReleaseTime;

        this.logger.warn(`Sender ${senderPublicKey} blocked until ${this.blockedByPublicKey[senderPublicKey].toUTC()}`);

        return blockReleaseTime;
    }

    /**
     * Processes recently accepted block by the blockchain.
     * It removes block transaction from the pool and adjusts
     * pool wallets for non existing transactions.
     */
    public acceptChainedBlock(block: models.Block) {
        for (const transaction of block.transactions) {
            const { data } = transaction;
            const exists = this.transactionExists(data.id);
            const senderPublicKey = data.senderPublicKey;
            const transactionService = TransactionServiceRegistry.get(transaction.type);

            const senderWallet = this.walletManager.exists(senderPublicKey)
                ? this.walletManager.findByPublicKey(senderPublicKey)
                : false;

            const recipientWallet = this.walletManager.exists(data.recipientId)
                ? this.walletManager.findByAddress(data.recipientId)
                : false;

            if (recipientWallet) {
                transactionService.applyToRecipient(transaction, recipientWallet);
            }

            if (exists) {
                this.removeTransaction(transaction);
            } else if (senderWallet) {
                // TODO: rework error handling
                try {
                    transactionService.canBeApplied(transaction, senderWallet);
                } catch (error) {
                    this.purgeByPublicKey(data.senderPublicKey);
                    this.blockSender(data.senderPublicKey);

                    this.logger.error(
                        `CanApply transaction test failed on acceptChainedBlock() in transaction pool for transaction id:${
                        data.id
                        } due to ${error.message}. Possible double spending attack`,
                    );
                    return;
                }

                transactionService.applyToSender(transaction, senderWallet);
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
            const increase = (block.data.reward as Bignum).plus(block.data.totalFee);
            delegateWallet.balance = delegateWallet.balance.plus(increase);
        }

        app.resolve("state").removeCachedTransactionIds(block.transactions.map(tx => tx.id));
    }

    /**
     * Rebuild pool manager wallets
     * Removes all the wallets from pool manager and applies transaction from pool - if any
     * It waits for the node to sync, and then check the transactions in pool
     * and validates them and apply to the pool manager.
     */
    public async buildWallets() {
        this.walletManager.reset();
        const poolTransactionIds = await this.getTransactionIdsForForging(0, this.getPoolSize());

        app.resolve<Blockchain.IStateStorage>("state").removeCachedTransactionIds(poolTransactionIds);

        poolTransactionIds.forEach(transactionId => {
            const transaction = this.getTransaction(transactionId);
            if (!transaction) {
                return;
            }

            const transactionService = TransactionServiceRegistry.get(transaction.type);
            const senderWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);

            // TODO: rework error handling
            try {
                transactionService.canBeApplied(transaction, senderWallet);
                transactionService.applyToSender(transaction, senderWallet);
            } catch (error) {
                this.logger.error(`BuildWallets from pool: ${error.message}`);
                this.purgeByPublicKey(transaction.data.senderPublicKey);
            }
        });
        this.logger.info("Transaction Pool Manager build wallets complete");
    }

    public purgeByPublicKey(senderPublicKey: string) {
        this.logger.debug(`Purging sender: ${senderPublicKey} from pool wallet manager`);

        this.removeTransactionsForSender(senderPublicKey);

        this.walletManager.deleteWallet(senderPublicKey);
    }

    /**
     * Purges all transactions from senders with at least one
     * invalid transaction.
     */
    public purgeSendersWithInvalidTransactions(block: models.Block) {
        const publicKeys = new Set(block.transactions.filter(tx => !tx.verified).map(tx => tx.data.senderPublicKey));

        publicKeys.forEach(publicKey => this.purgeByPublicKey(publicKey));
    }

    /**
     * Purges all transactions from the block.
     * Purges if transaction exists. It assumes that if trx exists that also wallet exists in pool
     */
    public purgeBlock(block: models.Block) {
        block.transactions.forEach(tx => {
            if (this.transactionExists(tx.id)) {
                this.removeTransaction(tx);
                this.walletManager.revertTransactionForSender(tx);
            }
        });
    }

    /**
     * Check whether a given sender has any transactions of the specified type
     * in the pool.
     */
    public senderHasTransactionsOfType(senderPublicKey: string, transactionType: constants.TransactionTypes): boolean {
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
     */
    public __createError(
        transaction: Transaction,
        type: string,
        message: string,
    ): transactionPool.IAddTransactionErrorResponse {
        return {
            transaction,
            type,
            message,
            success: false,
        };
    }

    /**
     * Remove all transactions from the pool that have expired.
     */
    private __purgeExpired() {
        for (const transaction of this.mem.getExpired(this.options.maxTransactionAge)) {
            this.emitter.emit("transaction.expired", transaction.data);

            this.walletManager.revertTransactionForSender(transaction);
            this.mem.remove(transaction.id, transaction.data.senderPublicKey);
            this.__syncToPersistentStorageIfNecessary();
        }
    }
}
