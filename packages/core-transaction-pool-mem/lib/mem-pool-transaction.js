'use strict'

const assert = require('assert')
const { Transaction } = require('@arkecosystem/crypto').models

/**
 * A mem pool transaction.
 * A normal transaction
 * + a sequence number used to order by insertion time
 * + an expiration time (Date object) used to remove old transactions from the pool
 */
module.exports = class MemPoolTransaction {
  /**
   * Construct a MemPoolTransaction object.
   * @param {Transaction} transaction base transaction object
   * @param {Object}      options     additional properties, the object can have
   *                                  `sequence` (Number) or `expireAt` (Date)
   *                                  set or it can be omitted.
   */
  constructor (transaction, options) {
    assert(transaction instanceof Transaction)
    this._transaction = transaction

    if (options !== undefined && options.sequence !== undefined) {
      assert(Number.isInteger(options.sequence))
      this._sequence = options.sequence
    }

    if (options !== undefined && options.expireAt !== undefined) {
      assert(options.expireAt instanceof Date)
      this._expireAt = options.expireAt
    }
  }

  get transaction () {
    return this._transaction
  }

  get sequence () {
    return this._sequence
  }

  set sequence (seq) {
    assert.strictEqual(this._sequence, undefined)
    this._sequence = seq
  }

  get expireAt () {
    return this._expireAt
  }

  set expireAt (exp) {
    assert.strictEqual(this._expireAt, undefined)
    this._expireAt = exp
  }
}
