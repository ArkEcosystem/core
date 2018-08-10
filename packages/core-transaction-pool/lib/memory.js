'use strict'

const without = require('lodash/without')

/**
 * We use this to store transaction IDs in memory to allow us filtering out
 * duplicate transactions before hitting the validator which in certain
 * cases can result in a race condition which in turn results in duplication
 * of transactions during that process and after all in the transaction pool.
 */
class Memory {
  /**
   * Create a new Memory instance.
   */
  constructor () {
    this.memory = []
  }

  /**
   * Memorize the given transactions.
   * @param  {Array} transactions
   * @return {Object}
   */
  memorize (transactions) {
    const valid = transactions.filter(t => !this.__includes(t.id))
    const invalid = transactions.filter(t => this.__includes(t.id))

    this.memory = this.memory.concat(transactions.map(t => t.id))

    return { valid, invalid }
  }

  /**
   * Forget the given transactions.
   * @param  {Array} transactions
   * @return {Memory}
   */
  forget (transactions) {
    this.memory = without(this.memory, transactions)

    return this
  }

  /**
   * Determine if the given transaction is memorized.
   * @param  {Object} transaction
   * @return {Boolean}
   */
  __includes (transaction) {
    return this.memory.includes(transaction)
  }
}

module.exports = new Memory()
