'use strict'

const Mem = require('./mem')
const Storage = require('./storage')
const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')
const emitter = container.resolvePlugin('event-emitter')
const logger = container.resolvePlugin('logger')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const { Transaction } = require('@arkecosystem/crypto').models
const { TransactionPoolInterface } = require('@arkecosystem/core-transaction-pool')

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
  make () {
    this.mem = new Mem()

    this.storage = new Storage(this.options.storage)

    const allSerialized = this.storage.loadAllInInsertionOrder()
    allSerialized.forEach(s => this.mem.add(new Transaction(s), this.options.maxTransactionAge, true))

    return this
  }

  /**
   * Disconnect from transaction pool.
   * @return {void}
   */
  disconnect () {
    this.__syncToPersistentStorage()
    this.storage.close()
  }

  /**
   * Get the number of transactions in the pool.
   * @return {Number}
   */
  getPoolSize () {
    this.__purgeExpired()

    return this.mem.getSize()
  }

  /**
   * Get the number of transactions in the pool from a specific sender
   * @param {String} senderPublicKey
   * @returns {Number}
   */
  getSenderSize (senderPublicKey) {
    this.__purgeExpired()

    return this.mem.getIdsBySender(senderPublicKey).size
  }

  /**
   * Add a transaction to the pool.
   * @param {Transaction} transaction
   */
  addTransaction (transaction) {
    if (this.transactionExists(transaction.id)) {
      logger.debug(
        'Transaction pool: ignoring attempt to add a transaction that is already ' +
        `in the pool, id: ${transaction.id}`)

      return
    }

    this.mem.add(transaction, this.options.maxTransactionAge)

    this.__syncToPersistentStorageIfNecessary()
  }

  /**
   * Add many transactions to the pool.
   * @param {Array}   transactions, already transformed and verified by transaction guard - must have serialized field
   */
  addTransactions (transactions) {
    transactions.forEach(t => this.addTransaction(t))
  }

  /**
   * Remove a transaction from the pool by transaction object.
   * @param  {Transaction} transaction
   * @return {void}
   */
  removeTransaction (transaction) {
    this.removeTransactionById(transaction.id, transaction.senderPublicKey)
  }

  /**
   * Remove a transaction from the pool by id.
   * @param  {String} id
   * @param  {String} senderPublicKey
   * @return {void}
   */
  removeTransactionById (id, senderPublicKey = undefined) {
    this.mem.remove(id, senderPublicKey)

    this.__syncToPersistentStorageIfNecessary()
  }

  /**
   * Remove multiple transactions from the pool (by object).
   * @param  {Array} transactions
   * @return {void}
   */
  removeTransactions (transactions) {
    transactions.forEach(t => this.removeTransaction(t))
  }

  /**
   * Check whether sender of transaction has exceeded max transactions in queue.
   * @param  {Transaction} transaction
   * @return {Boolean} true if exceeded
   */
  hasExceededMaxTransactions (transaction) {
    this.__purgeExpired()

    if (this.options.allowedSenders.includes(transaction.senderPublicKey)) {
      logger.debug(
        `Transaction pool: allowing sender public key: ${transaction.senderPublicKey} ` +
        '(listed in options.allowedSenders), thus skipping throttling.')
      return false
    }

    const count = this.mem.getIdsBySender(transaction.senderPublicKey).size

    return !(count <= this.options.maxTransactionsPerSender)
  }

  /**
   * Get a transaction by transaction id.
   * @param  {String} id
   * @return {(Transaction|undefined)}
   */
  getTransaction (id) {
    this.__purgeExpired()

    return this.mem.getTransactionById(id)
  }

  /**
   * Removes any transactions in the pool that have already been forged.
   * @param  {Array} transactionIds
   * @return {Array} IDs of pending transactions that have yet to be forged.
   */
  async removeForgedAndGetPending (transactionIds) {
    const forgedIdsSet = new Set(await database.getForgedTransactionsIds(transactionIds))

    forgedIdsSet.forEach(id => this.removeTransactionById(id))

    return transactionIds.filter(id => !forgedIdsSet.has(id))
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} blockSize
   * @return {(Array|void)}
   */
  async getTransactionsForForging (blockSize) {
    this.__purgeExpired()

    try {
      let transactionsIds = await this.getTransactionIdsForForging(0, this.mem.getSize())

      let transactions = []
      while (transactionsIds.length) {
        const id = transactionsIds.shift()
        const transaction = this.mem.getTransactionById(id)

        if (!transaction ||
            !this.checkDynamicFeeMatch(transaction) ||
            !(await this.checkApplyToBlockchain(transaction))) {
          continue
        }

        transactions.push(transaction.serialized)
        if (transactions.length === blockSize) {
          break
        }
      }

      return transactions
    } catch (error) {
      logger.error('Could not get transactions for forging: ', error, error.stack)
    }
  }

  /**
   * Get all transactions within the specified range (in insertion order).
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)} array of serialized transaction hex strings
   */
  getTransactions (start, size) {
    return this.getTransactionsData(start, size, 'serialized')
  }

  /**
   * Get all transactions within the specified range, removes already forged ones and possible duplicates
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array} array of transactions IDs in the specified range
   */
  async getTransactionIdsForForging (start, size) {
    const ids = this.getTransactionsData(start, size, 'id')
    return this.removeForgedAndGetPending(ids)
  }

  /**
   * Get data from all transactions within the specified range
   * @param  {Number} start
   * @param  {Number} size
   * @param  {String} property
   * @return {Array} array of transaction[property]
   */
  getTransactionsData (start, size, property) {
    this.__purgeExpired()

    const data = []

    let i = 0
    for (const transaction of this.mem.getTransactionsInInsertionOrder()) {
      if (i >= start + size) {
        break
      }

      if (i >= start) {
        data.push(transaction[property])
      }

      i++
    }

    return data
  }

  /**
   * Flush the pool (delete all transactions from it).
   * @return {void}
   */
  flush () {
    this.mem.flush()

    this.storage.deleteAll()
  }

  /**
   * Remove all transactions from the transaction pool belonging to specific sender.
   * @param  {String} senderPublicKey
   * @return {void}
   */
  removeTransactionsForSender (senderPublicKey) {
    this.mem.getIdsBySender(senderPublicKey).forEach(id => this.removeTransactionById(id))
  }

  /**
   * Checks if a transaction exists in the pool.
   * @param  {String} transactionId
   * @return {Boolean}
   */
  transactionExists (transactionId) {
    this.__purgeExpired()

    return this.mem.transactionExists(transactionId)
  }

  /**
   * Check whether there are any vote or unvote
   * transactions (transaction.type == TRANSACTION_TYPES.VOTE) in the pool
   * from a given sender.
   * @return {Boolean} true if exist
   */
  checkIfSenderHasVoteTransactions (senderPublicKey) {
    this.__purgeExpired()

    for (const id of this.mem.getIdsBySender(senderPublicKey)) {
      if (this.mem.getTransactionById(id).type === TRANSACTION_TYPES.VOTE) {
        return true
      }
    }

    return false
  }

  /**
   * Remove all transactions from the pool that have expired.
   * @return {void}
   */
  __purgeExpired () {
    for (const transaction of this.mem.getExpired()) {
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
  __syncToPersistentStorageIfNecessary () {
    if (this.options.syncInterval <= this.mem.getNumberOfDirty()) {
      this.__syncToPersistentStorage()
    }
  }

  /**
   * Sync the in-memory storage to the persistent (on-disk) storage.
   */
  __syncToPersistentStorage () {
    const added = this.mem.getDirtyAddedAndForget()
    this.storage.bulkAdd(added)

    const removed = this.mem.getDirtyRemovedAndForget()
    this.storage.bulkRemoveById(removed)
  }
}

module.exports = TransactionPool
