const assert = require('assert')
const crypto = require('@arkecosystem/crypto')

const TRANSACTION_TYPES = crypto.constants.TRANSACTION_TYPES
const Transaction = crypto.models.Transaction

/**
 * A mem pool transaction.
 * A normal transaction
 * + a sequence number used to order by insertion time
 * + a get-expiration-time method used to remove old transactions from the pool
 * + a ping count to determine wether it will get rebroadcasted or not.
 */
module.exports = class MemPoolTransaction {
  /**
   * Construct a MemPoolTransaction object.
   * @param {Transaction} transaction base transaction object
   * @param {Number}      sequence    insertion order sequence or undefined;
   *                                  if this is undefined at creation time,
   *                                  then it is assigned later using the
   *                                  setter method below
   * @param {Number}      pingCount   number of times the transaction has
   *                                  been received, used for rebroadcasting.
   */
  constructor(transaction, sequence, pingCount) {
    assert(transaction instanceof Transaction)
    this._transaction = transaction

    if (sequence !== undefined) {
      assert(Number.isInteger(sequence))
      this._sequence = sequence
    }

    this._pingCount = pingCount || 0
  }

  get transaction() {
    return this._transaction
  }

  get sequence() {
    return this._sequence
  }

  set sequence(seq) {
    assert.strictEqual(this._sequence, undefined)
    this._sequence = seq
  }

  get pingCount() {
    return this._pingCount
  }

  /**
   * Increase the ping count.
   */
  ping() {
    this._pingCount++
  }

  /**
   * Derive the transaction expiration time in number of seconds since
   * the genesis block.
   * @param {Number} maxTransactionAge maximum age (in seconds) of a transaction
   * @return {Number} expiration time or null if the transaction does not expire
   */
  expireAt(maxTransactionAge) {
    const t = this._transaction

    if (t.expiration > 0) {
      return t.expiration
    }

    if (t.type !== TRANSACTION_TYPES.TIMELOCK_TRANSFER) {
      return t.timestamp + maxTransactionAge
    }

    return null
  }
}
