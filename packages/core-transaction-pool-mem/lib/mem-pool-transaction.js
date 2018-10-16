'use strict'

const assert = require('assert')
const { Transaction } = require('@arkecosystem/crypto').models

/**
 * A mem pool transaction.
 * A normal transaction + a sequence number used to order by insertion time.
 */
class MemPoolTransaction {
  constructor (transaction, sequence) {
    assert(transaction instanceof Transaction)
    this.transaction_ = transaction

    if (sequence !== undefined) {
      assert(sequence instanceof Number)
      this.sequence_ = sequence
    }
  }

  get transaction () {
    return this.transaction_
  }

  get sequence () {
    assert.notEqual(this.sequence_, undefined)
    return this.sequence_
  }

  set sequence (seq) {
    assert.strictEqual(this.sequence_, undefined)
    this.sequence_ = seq
  }
}

module.exports = MemPoolTransaction
