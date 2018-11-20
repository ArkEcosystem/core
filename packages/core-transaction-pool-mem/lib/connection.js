/* eslint no-constant-condition: "off" */
/* eslint no-await-in-loop: "off" */

const {
  TransactionPoolInterface,
} = require('@arkecosystem/core-transaction-pool')

const assert = require('assert')
const container = require('@arkecosystem/core-container')
const Mem = require('./mem')
const MemPoolTransaction = require('./mem-pool-transaction')
const Storage = require('./storage')

const database = container.resolvePlugin('database')
const emitter = container.resolvePlugin('event-emitter')
const logger = container.resolvePlugin('logger')

/**
 * Transaction pool. It uses a hybrid storage - caching the data
 * in memory and occasionally saving it to a persistent, on-disk storage (SQLite),
 * every N modifications, and also during shutdown. The operations that only read
 * data (everything other than add or remove transaction) are served from the
 * in-memory storage.
 */
class TransactionPool extends TransactionPoolInterface {
  /**
   * Make the transaction pool instance. Load all transactions in the pool from
   * the on-disk database, saved there from a previous run.
   * @return {TransactionPool}
   */
  async make() {
    this.mem = new Mem()

    this.storage = new Storage(this.options.storage)

    const all = this.storage.loadAll()
    all.forEach(t => this.mem.add(t, this.options.maxTransactionAge, true))

    this.__purgeExpired()

    // Remove transactions that were forged while we were offline.
    const allIds = all.map(
      memPoolTransaction => memPoolTransaction.transaction.id,
    )

    const forgedIds = await database.getForgedTransactionsIds(allIds)

    forgedIds.forEach(id => this.removeTransactionById(id))

    return this
  }

  /**
   * Disconnect from transaction pool.
   * @return {void}
   */
  disconnect() {
    this.__syncToPersistentStorage()
    this.storage.close()
  }

  /**
   * Get the number of transactions in the pool.
   * @return {Number}
   */
  getPoolSize() {
    this.__purgeExpired()

    return this.mem.getSize()
  }

  /**
   * Get the number of transactions in the pool from a specific sender
   * @param {String} senderPublicKey
   * @returns {Number}
   */
  getSenderSize(senderPublicKey) {
    this.__purgeExpired()

    return this.mem.getBySender(senderPublicKey).size
  }

  /**
   * Add a transaction to the pool.
   * @param {Transaction} transaction
   * @return {Object} The success property indicates wether the transaction was successfully added
   * and applied to the pool or not. In case it was not successful, the type and message
   * property yield information about the error.
   */
  addTransaction(transaction) {
    if (this.transactionExists(transaction.id)) {
      logger.debug(
        'Transaction pool: ignoring attempt to add a transaction that is already ' +
          `in the pool, id: ${transaction.id}`,
      )

      return this.__createError(
        transaction,
        'ERR_ALREADY_IN_POOL',
        'Already in pool',
      )
    }

    const poolSize = this.mem.getSize()

    if (this.options.maxTransactionsInPool <= poolSize) {
      // The pool can't accommodate more transactions. Either decline the newcomer or remove
      // an existing transaction from the pool in order to free up space.
      const all = this.mem.getTransactionsOrderedByFee()
      const lowest = all[all.length - 1].transaction

      if (lowest.fee.isLessThan(transaction.fee)) {
        this.mem.remove(lowest.id, lowest.senderPublicKey)
      } else {
        return this.__createError(
          transaction,
          'ERR_POOL_FULL',
          `Pool is full (has ${poolSize} transactions) and this transaction's fee ` +
            `${transaction.fee.toFixed()} is not higher than the lowest fee already in pool ` +
            `${lowest.fee.toFixed()}`,
        )
      }
    }

    this.mem.add(
      new MemPoolTransaction(transaction),
      this.options.maxTransactionAge,
    )

    // Apply transaction to pool wallet manager.
    try {
      this.walletManager.applyPoolTransaction(transaction)
    } catch (error) {
      // Remove tx again from the pool
      this.mem.remove(transaction.id)

      return this.__createError(transaction, 'ERR_APPLY', error.toString())
    }

    this.__syncToPersistentStorageIfNecessary()
    return { success: true }
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
  addTransactions(transactions) {
    const added = []
    const notAdded = []

    for (const t of transactions) {
      const result = this.addTransaction(t)

      if (result.success) {
        added.push(t)
      } else {
        notAdded.push(result)
      }
    }

    return { added, notAdded }
  }

  /**
   * Remove a transaction from the pool by transaction object.
   * @param  {Transaction} transaction
   * @return {void}
   */
  removeTransaction(transaction) {
    this.removeTransactionById(transaction.id, transaction.senderPublicKey)
  }

  /**
   * Remove a transaction from the pool by id.
   * @param  {String} id
   * @param  {String} senderPublicKey
   * @return {void}
   */
  removeTransactionById(id, senderPublicKey = undefined) {
    this.mem.remove(id, senderPublicKey)

    this.__syncToPersistentStorageIfNecessary()
  }

  /**
   * Check whether sender of transaction has exceeded max transactions in queue.
   * @param  {Transaction} transaction
   * @return {Boolean} true if exceeded
   */
  hasExceededMaxTransactions(transaction) {
    this.__purgeExpired()

    if (this.options.allowedSenders.includes(transaction.senderPublicKey)) {
      logger.debug(
        `Transaction pool: allowing sender public key: ${
          transaction.senderPublicKey
        } (listed in options.allowedSenders), thus skipping throttling.`,
      )
      return false
    }

    const count = this.mem.getBySender(transaction.senderPublicKey).size

    return !(count <= this.options.maxTransactionsPerSender)
  }

  /**
   * Get a transaction by transaction id.
   * @param  {String} id
   * @return {(Transaction|undefined)}
   */
  getTransaction(id) {
    this.__purgeExpired()

    return this.mem.getTransactionById(id)
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} blockSize
   * @return {(Array|void)}
   */
  async getTransactionsForForging(blockSize) {
    this.__purgeExpired()

    const transactions = new Set()

    let fetchStart = 0
    let fetchSize = blockSize

    while (true) {
      for (const id of await this.getTransactionIdsForForging(
        fetchStart,
        fetchSize,
      )) {
        const transaction = this.mem.getTransactionById(id)

        if (transaction && this.checkApplyToBlockchain(transaction)) {
          transactions.add(transaction.serialized)
        }
      }

      if (
        transactions.size === blockSize ||
        fetchStart + fetchSize >= this.mem.getSize()
      ) {
        break
      }

      fetchStart += fetchSize
      fetchSize = blockSize - transactions.size
    }

    return Array.from(transactions)
  }

  /**
   * Get all transactions within the specified range [start, start + size), ordered by fee.
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)} array of serialized transaction hex strings
   */
  getTransactions(start, size) {
    return this.getTransactionsData(start, size, 'serialized')
  }

  /**
   * Get all transactions within the specified range [start, start + size).
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array} array of transactions IDs in the specified range
   */
  async getTransactionIdsForForging(start, size) {
    const ids = this.getTransactionsData(start, size, 'id')

    /* There should be no forged transactions in the mem pool. */
    assert.deepStrictEqual(await database.getForgedTransactionsIds(ids), [])

    return ids

    /*
    const forgedIdsSet = new Set(await database.getForgedTransactionsIds(ids))

    forgedIdsSet.forEach(id => this.removeTransactionById(id))

    return ids.filter(id => !forgedIdsSet.has(id))
    */
  }

  /**
   * Get data from all transactions within the specified range [start, start + size).
   * Transactions are ordered by fee (highest fee first) or by
   * insertion time, if fees equal (earliest transaction first).
   * @param  {Number} start
   * @param  {Number} size
   * @param  {String} property
   * @return {Array} array of transaction[property]
   */
  getTransactionsData(start, size, property) {
    this.__purgeExpired()

    const data = []

    let i = 0
    for (const memPoolTransaction of this.mem.getTransactionsOrderedByFee()) {
      if (i >= start + size) {
        break
      }

      if (i >= start) {
        assert.notStrictEqual(
          memPoolTransaction.transaction[property],
          undefined,
        )
        data.push(memPoolTransaction.transaction[property])
      }

      i++
    }

    return data
  }

  /**
   * Flush the pool (delete all transactions from it).
   * @return {void}
   */
  flush() {
    this.mem.flush()

    this.storage.deleteAll()
  }

  /**
   * Remove all transactions from the transaction pool belonging to specific sender.
   * @param  {String} senderPublicKey
   * @return {void}
   */
  removeTransactionsForSender(senderPublicKey) {
    this.mem
      .getBySender(senderPublicKey)
      .forEach(e => this.removeTransactionById(e.transaction.id))
  }

  /**
   * Checks if a transaction exists in the pool.
   * @param  {String} transactionId
   * @return {Boolean}
   */
  transactionExists(transactionId) {
    this.__purgeExpired()

    return this.mem.transactionExists(transactionId)
  }

  /**
   * Ping transaction.
   * @param  {String} transactionId
   * @return {void}
   */
  pingTransaction(transactionId) {
    this.mem.pingTransaction(transactionId)
  }

  /**
   * Get transaction ping.
   * @param  {String} transactionId
   * @return {Number}
   */
  getTransactionPing(transactionId) {
    return this.mem.getTransactionPing(transactionId)
  }

  /**
   * Get rebroadcast transactions (pingCount = 0).
   * @return {Array}
   */
  getRebroadcastTransactions() {
    return this.mem.getRebroadcastTransactions()
  }

  /**
   * Check whether a given sender has any transactions of the specified type
   * in the pool.
   * @param {String} senderPublicKey public key of the sender
   * @param {Number} transactionType transaction type, must be one of
   * TRANSACTION_TYPES.* and is compared against transaction.type.
   * @return {Boolean} true if exist
   */
  senderHasTransactionsOfType(senderPublicKey, transactionType) {
    this.__purgeExpired()

    for (const memPoolTransaction of this.mem.getBySender(senderPublicKey)) {
      if (memPoolTransaction.transaction.type === transactionType) {
        return true
      }
    }

    return false
  }

  /**
   * Remove all transactions from the pool that have expired.
   * @return {void}
   */
  __purgeExpired() {
    for (const transaction of this.mem.getExpired(
      this.options.maxTransactionAge,
    )) {
      emitter.emit('transaction.expired', transaction.data)

      this.walletManager.revertTransaction(transaction)

      this.mem.remove(transaction.id, transaction.senderPublicKey)

      this.__syncToPersistentStorageIfNecessary()
    }
  }

  /**
   * Sync the in-memory storage to the persistent (on-disk) storage if too
   * many changes have been accumulated in-memory.
   * @return {void}
   */
  __syncToPersistentStorageIfNecessary() {
    if (this.options.syncInterval <= this.mem.getNumberOfDirty()) {
      this.__syncToPersistentStorage()
    }
  }

  /**
   * Sync the in-memory storage to the persistent (on-disk) storage.
   */
  __syncToPersistentStorage() {
    const added = this.mem.getDirtyAddedAndForget()
    this.storage.bulkAdd(added)

    const removed = this.mem.getDirtyRemovedAndForget()
    this.storage.bulkRemoveById(removed)
  }

  /**
   * Create an error object which the TransactionGuard understands.
   * @param {Transaction} transaction
   * @param {String} type
   * @param {String} message
   * @return {Object}
   */
  __createError(transaction, type, message) {
    return {
      transaction,
      type,
      message,
      success: false,
    }
  }
}

module.exports = TransactionPool
