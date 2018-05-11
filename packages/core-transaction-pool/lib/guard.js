const reject = require('lodash/reject')
const { crypto } = require('@arkecosystem/client')
const { Transaction } = require('@arkecosystem/client').models

module.exports = class TransactionGuard {
  /**
   * Create a new transaction guard instance.
   * @param  {TransactionPoolInterface} pool
   * @return {void}
   */
  constructor (pool) {
    this.pool = pool

    this.__reset()
  }

  /**
   * Validate the specified transactions.
   * @param  {Array} transactions
   * @return {void}
   */
  async validate (transactions) {
    this.__reset()

    this.__transformTransactions(transactions)

    this.__determineInvalidTransactions()

    this.__determineExcessTransactions()
  }

  /**
   * Get a list of transaction ids.
   * @param  {String} type
   * @return {Object}
   */
  getIds (type = null) {
    if (type) {
      return this[type].map(transaction => transaction.id)
    }

    return {
      transactions: this.transactions.map(transaction => transaction.id),
      accept: this.accept.map(transaction => transaction.id),
      excess: this.excess.map(transaction => transaction.id),
      invalid: this.invalid.map(transaction => transaction.id)
    }
  }

  /**
   * Get a list of transaction objects.
   * @param  {String} type
   * @return {Object}
   */
  getTransactions (type = null) {
    if (type) {
      return this[type]
    }

    return {
      transactions: this.transactions,
      accept: this.accept,
      excess: this.excess,
      invalid: this.invalid
    }
  }

  /**
   * Check if there are N transactions of the specified type.
   * @param  {String}  type
   * @param  {Number}  count
   * @return {Boolean}
   */
  has (type, count) {
    return this.hasAny(type) === count
  }

  /**
   * Check if there are at least N transactions of the specified type.
   * @param  {String}  type
   * @param  {Number}  count
   * @return {Boolean}
   */
  hasAtLeast (type, count) {
    return this.hasAny(type) >= count
  }

  /**
   * Check if there are any transactions of the specified type.
   * @param  {String}  type
   * @return {Boolean}
   */
  hasAny (type) {
    return this[type].length
  }

  /**
   * Transform the specified transactions to models.
   * @param  {Array} transactions
   * @return {void}
   */
  __transformTransactions (transactions) {
    this.transactions = transactions
      .map(transaction => Transaction.serialize(transaction).toString('hex'))
      .map(transaction => Transaction.deserialize(transaction))
  }

  /**
   * Determine any invalid transactions, usually caused by invalid crypto or insufficient funds.
   * @return {void}
   */
  __determineInvalidTransactions () {
    this.transactions = reject(this.transactions, transaction => {
      const verified = this.__verifyTransaction(transaction)

      if (!verified) {
        this.invalid.push(transaction)
      }

      return !verified
    })
  }

  /**
   * Determine transactions that exceed the rate-limit.
   * @return {void}
   */
  async __determineExcessTransactions () {
    const transactions = await this.pool.determineExcessTransactions(this.transactions)

    this.accept = transactions.accept
    this.excess = transactions.excess
  }

  /**
   * Verify if the transactions is valid and if the sender has sufficient funds.
   * @param  {Object} transaction
   * @return {Boolean}
   */
  __verifyTransaction (transaction) {
    const wallet = this.pool.walletManager.getWalletByPublicKey(transaction.senderPublicKey)

    return crypto.verify(transaction) && wallet.canApply(transaction)
  }

  /**
   * Reset all indices.
   * @return {void}
   */
  __reset () {
    this.transactions = []
    this.accept = []
    this.excess = []
    this.invalid = []
  }
}
