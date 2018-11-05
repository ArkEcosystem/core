'use strict'

const assert = require('assert')
const { slots } = require('@arkecosystem/crypto')

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
     * An array of MemPoolTransaction sorted by fee (the transaction with the
     * highest fee is first). If the fee is equal, they are sorted by insertion
     * order.
     * Used to:
     * - get the transactions with the highest fee
     * - get the number of all transactions in the pool
     */
    this.all = []

    /**
     * A boolean flag indicating whether `this.all` is indeed sorted or
     * temporarily left unsorted. We use lazy sorting of `this.all`:
     * - insertion just appends at the end (O(1)) + flag it as unsorted
     * - deletion removes by using splice() (O(n)) + flag it as unsorted
     * - lookup sorts if it is not sorted (O(n*log(n)) + flag it as sorted
     */
    this.allIsSorted = true

    /**
     * A map of (key=transaction id, value=MemPoolTransaction).
     * Used to:
     * - get a transaction, given its ID
     */
    this.byId = {}

    /**
     * A map of (key=sender public key, value=Set of MemPoolTransaction).
     * Used to:
     * - get all transactions from a given sender
     * - get the number of all transactions from a given sender.
     */
    this.bySender = {}

    /**
     * An array of MemPoolTransaction, sorted by expiration (earliest date
     * comes first). This array may not contain all transactions that are
     * in the pool, transactions that are without expiration are not included.
     * Used to:
     * - find all transactions that have expired (have an expiration date
     *   earlier than a given date) - they are at the beginning of the array.
     */
    this.sortedByExpiration = []

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
      assert.strictEqual(typeof memPoolTransaction.sequence, 'number')
      this.sequence = Math.max(this.sequence, memPoolTransaction.sequence) + 1
    } else {
      // Sequence should only be set during DB load (when sequences come
      // from the database). In other scenarios sequence is not set and we
      // set it here.
      memPoolTransaction.sequence = this.sequence++
    }

    this.all.push(memPoolTransaction)
    this.allIsSorted = false

    this.byId[transaction.id] = memPoolTransaction

    const sender = transaction.senderPublicKey
    if (this.bySender[sender] === undefined) {
      // First transaction from this sender, create a new Set.
      this.bySender[sender] = new Set([memPoolTransaction])
    } else {
      // Append to existing transaction ids for this sender.
      this.bySender[sender].add(memPoolTransaction)
    }

    if (memPoolTransaction.expireAt(maxTransactionAge) !== null) {
      this.sortedByExpiration.push(memPoolTransaction)

      // XXX worst case: O(n * log(n))
      this.sortedByExpiration.sort(
        (a, b) => a.expireAt(maxTransactionAge) - b.expireAt(maxTransactionAge)
      )
    }

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

    const memPoolTransaction = this.byId[id]

    // XXX worst case: O(n)
    let i = this.sortedByExpiration.findIndex(e => e.transaction.id === id)
    if (i !== -1) {
      this.sortedByExpiration.splice(i, 1)
    }

    this.bySender[senderPublicKey].delete(memPoolTransaction)
    if (this.bySender[senderPublicKey].size === 0) {
      delete this.bySender[senderPublicKey]
    }

    delete this.byId[id]

    i = this.all.findIndex(e => e.transaction.id === id)
    assert.notStrictEqual(i, -1)
    this.all.splice(i, 1)
    this.allIsSorted = false

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
    return this.all.length
  }

  /**
   * Get all transactions from a given sender.
   * @param {String} senderPublicKey public key of the sender
   * @return {Set of MemPoolTransaction} all transactions for the given sender, could be empty Set
   */
  getBySender (senderPublicKey) {
    const memPoolTransactions = this.bySender[senderPublicKey]
    if (memPoolTransactions !== undefined) {
      return memPoolTransactions
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
   * Get an array of all transactions ordered by fee.
   * Transactions are ordered by fee (highest fee first) or by
   * insertion time, if fees equal (earliest transaction first).
   * @return {Array of MemPoolTransaction} transactions
   */
  getTransactionsOrderedByFee () {
    if (!this.allIsSorted) {
      this.all.sort(function (a, b) {
        if (a.transaction.fee.isGreaterThan(b.transaction.fee)) {
          return -1
        }
        if (a.transaction.fee.isLessThan(b.transaction.fee)) {
          return 1
        }
        return a.sequence - b.sequence
      })
      this.allIsSorted = true
    }

    return this.all
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
   * @param {Number} maxTransactionAge maximum age of a transaction in seconds
   * @return {Array of Transaction} expired transactions
   */
  getExpired (maxTransactionAge) {
    const now = slots.getTime()

    let transactions = []

    for (const memPoolTransaction of this.sortedByExpiration) {
      if (memPoolTransaction.expireAt(maxTransactionAge) <= now) {
        transactions.push(memPoolTransaction.transaction)
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
    this.all = []
    this.allIsSorted = true
    this.byId = {}
    this.bySender = {}
    this.sortedByExpiration = []
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
