'use strict'

const ark = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')
const emitter = container.resolvePlugin('event-emitter')
const formatTimestamp = require('@arkecosystem/core-api/lib/versions/2/transformers/utils/format-timestamp')
const logger = container.resolvePlugin('logger')
const { TRANSACTION_TYPES } = ark.constants
const { TransactionPoolInterface } = require('@arkecosystem/core-transaction-pool')

/**
 * This transaction pool uses a hybrid storage - caching the data
 * in memory and occasionally saving it to a permanent, on-disk storage (SQLite),
 * every N modifications, and also during shutdown. The operations that only read
 * data (everything other than add or remove transaction) are served from the
 * in-memory storage.
 */
module.exports = class TransactionPool extends TransactionPoolInterface {
  /**
   * Make the transaction pool instance. Load all transactions in the pool from
   * the on-disk database, saved there from a previous run.
   * @return {TransactionPool}
   */
  async make () {
    this.__memConstruct()

    await this.__memLoadFromDB()

    return this
  }

  /**
   * Disconnect from transaction pool.
   * @return {void}
   */
  async disconnect () {
    await this.__memSyncToPermanentStorage()
  }

  /**
   * Get the number of transactions in the pool.
   * @return {Number}
   */
  async getPoolSize () {
    await this.__purgeExpired()

    return this.mem.byId.size
  }

  /**
   * Get the number of transactions in the pool from a specific sender
   * @param {String} senderPublicKey
   * @returns {Number}
   */
  async getSenderSize (senderPublicKey) {
    await this.__purgeExpired()

    const ids = this.mem.idsBySender.get(senderPublicKey)

    return ids === undefined ? 0 : ids.size
  }

  /**
   * Add a transaction to the pool.
   * @param {Transaction} transaction
   */
  async addTransaction (transaction) {
    if (await this.transactionExists(transaction.id)) {
      return logger.debug(`Duplicated transaction ${transaction.id} - transaction already in pool.`)
    }

    this.__memAddTransaction(transaction)

    await this.__memSyncToPermanentStorageIfNecessary()
  }

  /**
   * Add many transactions to the pool.
   * @param {Array}   transactions, already transformed and verified by transaction guard - must have serialized field
   */
  async addTransactions (transactions) {
    await Promise.all(transactions.map(t => this.addTransaction(t)))
  }

  /**
   * Remove a transaction from the pool by transaction object.
   * @param  {Transaction} transaction
   * @return {void}
   */
  async removeTransaction (transaction) {
    await this.removeTransactionById(transaction.id, transaction.senderPublicKey)
  }

  /**
   * Remove a transaction from the pool by id.
   * @param  {String} id
   * @param  {String} senderPublicKey
   * @return {void}
   */
  async removeTransactionById (id, senderPublicKey = undefined) {
    this.__memRemoveTransaction(id, senderPublicKey)

    await this.__memSyncToPermanentStorageIfNecessary()
  }

  /**
   * Remove multiple transactions from the pool (by object).
   * @param  {Array} transactions
   * @return {void}
   */
  async removeTransactions (transactions) {
    for (const t of transactions) {
      await this.removeTransaction(t)
    }
  }

  /**
   * Check whether sender of transaction has exceeded max transactions in queue.
   * @param  {Transaction} transaction
   * @return {(Boolean|void)}
   */
  async hasExceededMaxTransactions (transaction) {
    await this.__purgeExpired()

    if (this.options.allowedSenders.includes(transaction.senderPublicKey)) {
      logger.debug(`Transaction pool allowing ${transaction.senderPublicKey} senderPublicKey, thus skipping throttling.`)
      return false
    }

    const ids = this.mem.idsBySender.get(transaction.senderPublicKey)
    const count = ids === undefined ? 0 : ids.size

    return count > 0 ? count >= this.options.maxTransactionsPerSender : false
  }

  /**
   * Get a transaction by transaction id.
   * @param  {String} id
   * @return {(Transaction|undefined)}
   */
  async getTransaction (id) {
    await this.__purgeExpired()

    return this.mem.byId.get(id)
  }

  /**
   * Removes any transactions in the pool that have already been forged.
   * @param  {Array} transactionIds
   * @return {Array} IDs of pending transactions that have yet to be forged.
   */
  async removeForgedAndGetPending (transactionIds) {
    const forgedIdsSet = new Set(await database.getForgedTransactionsIds(transactionIds))

    await Promise.all(forgedIdsSet, async (transactionId) => {
      await this.removeTransactionById(transactionId)
    })

    return transactionIds.filter(id => !forgedIdsSet.has(id))
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} blockSize
   * @return {(Array|void)}
   */
  async getTransactionsForForging (blockSize) {
    await this.__purgeExpired()

    try {
      let transactionsIds = await this.getTransactionIdsForForging(0, this.mem.byId.size)

      let transactions = []
      while (transactionsIds.length) {
        const id = transactionsIds.shift()
        const transaction = this.mem.byId.get(id)

        if (!transaction ||
            !this.checkDynamicFeeMatch(transaction) ||
            !this.checkApplyToBlockchain(transaction)) {
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
  async getTransactions (start, size) {
    await this.__purgeExpired()

    let serializedTransactions = []

    let i = 0
    for (let transaction of this.mem.byId.values()) {
      if (i >= start + size) {
        break
      }

      if (i >= start) {
        serializedTransactions.push(transaction.serialized)
      }

      i++
    }

    return serializedTransactions
  }

  /**
   * Get all transactions within the specified range, removes already forged ones and possible duplicates
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array} array of transactions IDs in the specified range
   */
  async getTransactionIdsForForging (start, size) {
    await this.__purgeExpired()

    let ids = []

    let i = 0
    for (let transaction of this.mem.byId.values()) {
      if (i >= start + size) {
        break
      }

      if (i >= start) {
        ids.push(transaction.id)
      }

      i++
    }

    return this.removeForgedAndGetPending(ids)
  }

  /**
   * Flush the pool (delete all transactions from it).
   * @return {void}
   */
  async flush () {
    this.__memFlush()

    await database.transactionPoolDeleteAll()
  }

  /**
   * Remove all transactions from the transaction pool belonging to specific sender.
   * @param  {String} senderPublicKey
   * @return {void}
   */
  async removeTransactionsForSender (senderPublicKey) {
    // Copy the ids, so that we do not delete elements of the container
    // while looping over its elements.
    const ids = Array.from(this.mem.idsBySender.get(senderPublicKey))
    for (const id of ids) {
      await this.removeTransactionById(id)
    }
  }

  /**
   * Checks if a transaction exists in the pool.
   * @param  {String} transactionId
   * @return {Boolean}
   */
  async transactionExists (transactionId) {
    await this.__purgeExpired()

    return this.mem.byId.has(transactionId)
  }

  /**
   * Remove all transactions from the pool that have expired.
   * @return {void}
   */
  async __purgeExpired () {
    const now = new Date()

    let ids = []

    for (let e of this.mem.idsByExpiration) {
      if (e.expireAt >= now) {
        break
      }
      ids.push(e.transactionId)
    }

    for (const id of ids) {
      const transaction = this.mem.byId.get(id)

      emitter.emit('transaction.expired', transaction.data)

      this.walletManager.revertTransaction(transaction)

      this.__memRemoveTransaction(id, transaction.senderPublicKey)

      await this.__memSyncToPermanentStorageIfNecessary()
    }
  }

  /**
   * Create the in-memory transaction pool structures.
   * @return {void}
   */
  __memConstruct () {
    this.mem = {
      /**
       * A map of (key=transaction id, value=Transaction object).
       * Used to:
       * - get a transaction, given its ID
       * - get the number of all transactions in the pool
       * - get all transactions in a given range [start, end) in insertion order.
       */
      byId: new Map(),

      /**
       * A map of (key=sender public key, value=Set of transaction ids).
       * Used to:
       * - get all transactions ids from a given sender
       * - get the number of all transactions from a given sender.
       */
      idsBySender: new Map(),

      /**
       * An array of { expireAt: Date, transactionId: ... } objects, sorted
       * by expireAt (earliest date comes first).
       * Used to:
       * - find all transactions that have expired (have an expiration date
       *   earlier than a given date) - they are at the beginning of the array.
       */
      idsByExpiration: [],

      /**
       * List of dirty transactions ids (that are not saved in the on-disk
       * database yet).
       * Used to delay and group operations to the on-disk database.
       */
      dirty: {
        added: new Set(),
        removed: new Set()
      }
    }
  }

  /**
   * Load all transactions from the permanent (on-disk) storage.
   * Used during startup to restore the state of the transaction pool as of
   * before the restart.
   * @return {void}
   */
  async __memLoadFromDB () {
    const transactions = await database.transactionPoolLoad()

    for (const t of transactions) {
      this.__memAddTransaction(t, true)
    }
  }

  /**
   * Add a transaction to the in-memory storage.
   * @param  {Transaction} transaction  The transaction to be added
   * @param  {Boolean}     thisIsDBLoad If true, then this is the initial
   *                                    loading from the database and we do
   *                                    not need to schedule the transaction
   *                                    that is being added for saving to disk
   * @return {void}
   */
  __memAddTransaction (transaction, thisIsDBLoad = false) {
    // Add to mem.byId.
    // If adding to the map by reference is not desired (in case the
    // Transaction object is changed and we do not want the changes to
    // propagate inside the Map) then use the line below (Object.assign()).
    // Beware - this does a shallow copy only.
    // this.mem.byId.set(transaction.id, Object.assign({}, transaction))
    this.mem.byId.set(transaction.id, transaction)

    // Add to mem.idsBySender.
    const sender = transaction.senderPublicKey
    let s = this.mem.idsBySender.get(sender)
    if (s === undefined) {
      // First transaction from this sender, create a new Set.
      this.mem.idsBySender.set(sender, new Set([transaction.id]))
    } else {
      // Append to existing transaction ids for this sender.
      s.add(transaction.id)
    }

    // Add to mem.idsByExpiration.
    let expireSecondsSinceGenesis
    if (transaction.expiration > 0) {
      expireSecondsSinceGenesis = transaction.expiration
    } else if (transaction.type !== TRANSACTION_TYPES.TIMELOCK_TRANSFER) {
      expireSecondsSinceGenesis = transaction.timestamp + this.options.maxTransactionAge
    }
    if (expireSecondsSinceGenesis) {
      const expireAt = new Date(formatTimestamp(expireSecondsSinceGenesis).unix * 1000)

      this.mem.idsByExpiration.push(
        { expireAt: expireAt, transactionId: transaction.id })

      // The array is almost sorted or even fully sorted here, so the below is quick.

      this.mem.idsByExpiration.sort(function (a, b) {
        return a.expireAt - b.expireAt
      })
    }

    if (!thisIsDBLoad) {
      if (this.mem.dirty.removed.has(transaction.id)) {
        // If the transaction has been already in the pool and has been removed
        // and the removal has not propagated to disk yet, just wipe it from the
        // list of removed transactions, so that the old copy stays on disk.
        this.mem.dirty.removed.delete(transaction.id)
      } else {
        this.mem.dirty.added.add(transaction.id)
      }
    }
  }

  /**
   * Remove a transaction from the in-memory storage.
   * @param  {String} id              The ID of the transaction to be removed
   * @param  {String} senderPublicKey Transaction's sender public key
   * @return {void}
   */
  __memRemoveTransaction (id, senderPublicKey) {
    if (senderPublicKey === undefined) {
      senderPublicKey = this.mem.byId.get(id).senderPublicKey
    }

    // O(n)
    const index = this.mem.idsByExpiration.findIndex(function (element) {
      return element.transactionId === id
    })
    this.mem.idsByExpiration.splice(index, 1)

    this.mem.idsBySender.delete(senderPublicKey)

    this.mem.byId.delete(id)

    if (this.mem.dirty.added.has(id)) {
      // This transaction has been added and deleted without data being synced
      // to disk in between, so it will never touch the disk, just remove it
      // from the added list.
      this.mem.dirty.added.delete(id)
    } else {
      this.mem.dirty.removed.add(id)
    }
  }

  /**
   * Sync the in-memory storage to the permanent (on-disk) storage if too
   * many changes have been accumulated in-memory.
   * @return {void}
   */
  async __memSyncToPermanentStorageIfNecessary () {
    if (this.mem.dirty.added.size + this.mem.dirty.removed.size >= 512) {
      await this.__memSyncToPermanentStorage()
    }
  }

  /**
   * Sync the in-memory storage to the permanent (on-disk) storage.
   * @return {void}
   */
  async __memSyncToPermanentStorage () {
    if (this.mem.dirty.added.size > 0) {
      // Convert transaction ids from `this.mem.dirty.added` to Transaction
      // objects in `toAdd`.
      let toAdd = []
      this.mem.dirty.added.forEach(id => toAdd.push(this.mem.byId.get(id)))
      await database.transactionPoolAdd(toAdd)
      this.mem.dirty.added.clear()
    }

    if (this.mem.dirty.removed.size > 0) {
      let toRemove = Array.from(this.mem.dirty.removed)
      await database.transactionPoolRemoveById(toRemove)
      this.mem.dirty.removed.clear()
    }
  }

  /**
   * Reset (wipe) the in-memory storage to an empty state without saving data to
   * the permanent (on-disk) storage.
   * @return {void}
   */
  __memFlush () {
    this.mem.byId.clear()
    this.mem.idsBySender.clear()
    this.mem.idsByExpiration = []
    this.mem.dirty.added.clear()
    this.mem.dirty.removed.clear()
  }
}
