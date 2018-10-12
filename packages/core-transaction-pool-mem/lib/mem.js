'use strict'

const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const { formatTimestamp } = require('@arkecosystem/core-utils')

class Mem {
  /**
   * Create the in-memory transaction pool structures.
   */
  constructor () {
    /**
     * A map of (key=transaction id, value=Transaction object).
     * Used to:
     * - get a transaction, given its ID
     * - get the number of all transactions in the pool
     * - get all transactions in a given range [start, end) in insertion order.
     */
    this.byId = new Map()

    /**
     * A map of (key=sender public key, value=Set of transaction ids).
     * Used to:
     * - get all transactions ids from a given sender
     * - get the number of all transactions from a given sender.
     */
    this.idsBySender = new Map()

    /**
     * An array of { expireAt: Date, transactionId: ... } objects, sorted
     * by expireAt (earliest date comes first).
     * Used to:
     * - find all transactions that have expired (have an expiration date
     *   earlier than a given date) - they are at the beginning of the array.
     */
    this.idsByExpiration = []

    /**
     * List of dirty transactions ids (that are not saved in the on-disk
     * database yet). Used to delay and group operations to the on-disk database.
     */
    this.dirty = {
      added: new Set(),
      removed: new Set()
    }
  }

  /**
   * Add a transaction.
   * @param {Transaction} transaction       transaction to add
   * @param {Number}      maxTransactionAge maximum age of a transaction in seconds
   * @param {Boolean}     thisIsDBLoad      if true, then this is the initial
   *                                        loading from the database and we do
   *                                        not need to schedule the transaction
   *                                        that is being added for saving to disk
   */
  add (transaction, maxTransactionAge, thisIsDBLoad = false) {
    this.byId.set(transaction.id, transaction)

    const sender = transaction.senderPublicKey
    let s = this.idsBySender.get(sender)
    if (s === undefined) {
      // First transaction from this sender, create a new Set.
      this.idsBySender.set(sender, new Set([transaction.id]))
    } else {
      // Append to existing transaction ids for this sender.
      s.add(transaction.id)
    }

    let expireSecondsSinceGenesis
    if (transaction.expiration > 0) {
      expireSecondsSinceGenesis = transaction.expiration
    } else if (transaction.type !== TRANSACTION_TYPES.TIMELOCK_TRANSFER) {
      expireSecondsSinceGenesis = transaction.timestamp + maxTransactionAge
    }
    if (expireSecondsSinceGenesis) {
      const expireAt = new Date(formatTimestamp(expireSecondsSinceGenesis).unix * 1000)

      this.idsByExpiration.push({ expireAt: expireAt, transactionId: transaction.id })

      // The array is almost sorted or even fully sorted here, so the below is quick.

      this.idsByExpiration.sort(function (a, b) {
        return a.expireAt - b.expireAt
      })

      if (!thisIsDBLoad) {
        if (this.dirty.removed.has(transaction.id)) {
          // If the transaction has been already in the pool and has been removed
          // and the removal has not propagated to disk yet, just wipe it from the
          // list of removed transactions, so that the old copy stays on disk.
          this.dirty.removed.delete(transaction.id)
        } else {
          this.dirty.added.add(transaction.id)
        }
      }
    }
  }

  /**
   * Remove a transaction.
   * @param {String} id              id of the transaction to remove
   * @param {String} senderPublicKey public key of the sender, could be undefined
   */
  remove (id, senderPublicKey) {
    if (senderPublicKey === undefined) {
      const transaction = this.byId.get(id)
      if (transaction === undefined) {
        // Not found, not in pool
        return
      }
      senderPublicKey = transaction.senderPublicKey
    }

    // O(n)
    const index = this.idsByExpiration.findIndex(function (element) {
      return element.transactionId === id
    })
    if (index === -1) {
      // Not found, not in pool
      return
    }
    this.idsByExpiration.splice(index, 1)

    this.idsBySender.delete(senderPublicKey)

    this.byId.delete(id)

    if (this.dirty.added.has(id)) {
      // This transaction has been added and deleted without data being synced
      // to disk in between, so it will never touch the disk, just remove it
      // from the added list.
      this.dirty.added.delete(id)
    } else {
      this.dirty.removed.add(id)
    }
  }

  /**
   * Get the number of transactions.
   * @return Number
   */
  getSize () {
    return this.byId.size
  }

  /**
   * Get all transactions ids from a given sender.
   * @param {String} senderPublicKey public key of the sender
   * @return {Set of String} all ids for the given sender, could be empty Set
   */
  getIdsBySender (senderPublicKey) {
    const ids = this.idsBySender.get(senderPublicKey)
    if (ids !== undefined) {
      return ids
    }
    return new Set()
  }

  /**
   * Get a transaction, given its id.
   * @param {String} id transaction id
   * @return {Transaction|undefined}
   */
  getTransactionById (id) {
    return this.byId.get(id)
  }

  /**
   * Get an interator to all transactions in insertion order.
   * @return {Iterator}
   */
  getTransactionsInInsertionOrder () {
    return this.byId.values()
  }

  /**
   * Check if a transaction with a given id exists.
   * @param {String} id transaction id
   * @return {Boolean} true if exists
   */
  transactionExists (id) {
    return this.byId.has(id)
  }

  /**
   * Get the expired transactions.
   * @return {Array of Transaction} expired transactions
   */
  getExpired () {
    const now = new Date()

    let transactions = []

    for (const e of this.idsByExpiration) {
      if (e.expireAt <= now) {
        transactions.push(this.byId.get(e.transactionId))
      } else {
        break
      }
    }

    return transactions
  }

  /**
   * Remove all transactions.
   */
  flush () {
    this.byId.clear()
    this.idsBySender.clear()
    this.idsByExpiration = []
    this.dirty.added.clear()
    this.dirty.removed.clear()
  }

  /**
   * Get the number of dirty transactions (added or removed, but those additions or
   * removals have not been applied to the persistent storage).
   * @return {Number} number of dirty transactions
   */
  getNumberOfDirty () {
    return this.dirty.added.size + this.dirty.removed.size
  }

  /**
   * Get the dirty transactions that were added and forget they are dirty.
   * In other words, get the transactions that were added since the last
   * call to this method (or to the flush() method).
   * @return {Array of Transaction}
   */
  getDirtyAddedAndForget () {
    let added = []
    this.dirty.added.forEach(id => added.push(this.byId.get(id)))
    this.dirty.added.clear()
    return added
  }

  /**
   * Get the ids of dirty transactions that were removed and forget them completely.
   * In other words, get the transactions that were removed since the last
   * call to this method (or to the flush() method).
   * @return {Array of String} transaction ids
   */
  getDirtyRemovedAndForget () {
    const removed = Array.from(this.dirty.removed)
    this.dirty.removed.clear()
    return removed
  }
}

module.exports = Mem
