'use strict'

const assert = require('assert')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const { formatTimestamp } = require('@arkecosystem/core-utils')

class Mem {
  /**
   * Create the in-memory transaction pool structures.
   */
  constructor () {
    /**
     * A monotonically increasing number, assigned to each new transaction and
     * then incremented.
     * Used to:
     * - keep insertion order.
     */
    this.sequence = 0

    /**
     * A map of (key=transaction id, value=MemPoolTransaction).
     * Used to:
     * - get a transaction, given its ID
     */
    this.byId = {}

    /**
     * An array of transactions ids sorted by fee (the id of the transaction
     * with the highest fee is first). If the fee is equal, they are sorted
     * by insertion order.
     * Used to:
     * - get the transactions with the highest fee
     * - get the number of all transactions in the pool
     */
    this.idsSortedByFee = []

    /**
     * A map of (key=sender public key, value=Set of transaction ids).
     * Used to:
     * - get all transactions ids from a given sender
     * - get the number of all transactions from a given sender.
     */
    this.idsBySender = {}

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
   * @param {MemPoolTransaction} memPoolTransaction transaction to add
   * @param {Number}             maxTransactionAge  maximum age of a transaction in seconds
   * @param {Boolean}            thisIsDBLoad       if true, then this is the initial
   *                                                loading from the database and we do
   *                                                not need to schedule the transaction
   *                                                that is being added for saving to disk
   */
  add (memPoolTransaction, maxTransactionAge, thisIsDBLoad = false) {
    const transaction = memPoolTransaction.transaction

    assert.strictEqual(this.byId[transaction.id], undefined)

    if (thisIsDBLoad) {
      // Sequence is provided from outside, make sure we avoid duplicates
      // later when we start using our this.sequence.
      assert.equal(typeof memPoolTransaction.sequence, 'number')
      this.sequence = Math.max(this.sequence, memPoolTransaction.sequence)
    } else {
      // Sequence should only be set during DB load (when sequences come
      // from the database). In other scenarios sequence is not set and we
      // set it here.
      memPoolTransaction.sequence = this.sequence++
    }

    this.byId[transaction.id] = memPoolTransaction

    this.idsSortedByFee.push(transaction.id)
    // Sort largest fee first, if fees equal, then
    // smaller sequence (earlier transaction) first.
    // XXX worst case: O(n * log(n))
    this.idsSortedByFee.sort(function (idA, idB) {
      const a = this.byId[idA]
      const b = this.byId[idB]
      if (a.transaction.fee > b.transaction.fee) {
        return -1
      }
      if (a.transaction.fee < b.transaction.fee) {
        return 1
      }
      return a.sequence - b.sequence
    }.bind(this))

    const sender = transaction.senderPublicKey
    if (this.idsBySender[sender] === undefined) {
      // First transaction from this sender, create a new Set.
      this.idsBySender[sender] = new Set([transaction.id])
    } else {
      // Append to existing transaction ids for this sender.
      this.idsBySender[sender].add(transaction.id)
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

      // XXX worst case: O(n * log(n))
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
    if (this.byId[id] === undefined) {
      // Not found, not in pool
      return
    }

    if (senderPublicKey === undefined) {
      senderPublicKey = this.byId[id].transaction.senderPublicKey
    }

    // XXX worst case: O(n)
    let i = this.idsByExpiration.findIndex(function (element) {
      return element.transactionId === id
    })
    if (i !== -1) {
      this.idsByExpiration.splice(i, 1)
    }

    this.idsBySender[senderPublicKey].delete(id)
    if (this.idsBySender[senderPublicKey].size === 0) {
      delete this.idsBySender[senderPublicKey]
    }

    // XXX worst case: O(n)
    i = this.idsSortedByFee.indexOf(id)
    assert.notEqual(i, -1)
    this.idsSortedByFee.splice(i, 1)

    delete this.byId[id]

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
    return this.idsSortedByFee.length
  }

  /**
   * Get all transactions ids from a given sender.
   * @param {String} senderPublicKey public key of the sender
   * @return {Set of String} all ids for the given sender, could be empty Set
   */
  getIdsBySender (senderPublicKey) {
    const ids = this.idsBySender[senderPublicKey]
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
    if (this.byId[id] === undefined) {
      return undefined
    }
    return this.byId[id].transaction
  }

  /**
   * Get an array of all transactions ids ordered by fee.
   * Transactions are ordered by fee (highest fee first) or by
   * insertion time, if fees equal (earliest transaction first).
   * @return {Array of String} transactions ids
   */
  getTransactionsIdsOrderedByFee () {
    return this.idsSortedByFee
  }

  /**
   * Check if a transaction with a given id exists.
   * @param {String} id transaction id
   * @return {Boolean} true if exists
   */
  transactionExists (id) {
    return this.byId[id] !== undefined
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
        transactions.push(this.byId[e.transactionId].transaction)
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
    this.byId = {}
    this.idsSortedByFee = []
    this.idsBySender = {}
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
   * @return {Array of MemPoolTransaction}
   */
  getDirtyAddedAndForget () {
    let added = []
    this.dirty.added.forEach(id => added.push(this.byId[id]))
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
