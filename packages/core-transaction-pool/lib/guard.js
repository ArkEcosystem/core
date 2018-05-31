const reject = require('lodash/reject')
const container = require('@arkecosystem/core-container')

const { Transaction } = require('@arkecosystem/crypto').models
const dynamicFeeMatch = require('./utils/dynamicfee-matcher')

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
   * Validate the specified transactions. Order of called functions is important
   * @param  {Array} transactions
   * @param  {Boolean} isBroadcast flag
   * @return {void}
   */
  async validate (transactions, isBroadCasted) {
    this.__reset()

    this.__transformTransactions(transactions)

    this.__determineInvalidTransactions()

    this.__determineTransactionsForBroadCast(isBroadCasted)

    this.__determineFeeMatchingTransactions()

    await this.__determineExcessTransactions()
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
      invalid: this.invalid.map(transaction => transaction.id),
      broadcast: this.broadcast.map(transaction => transaction.id)
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
      invalid: this.invalid,
      broadcast: this.broadcast
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
     this.transactions = transactions.map(transaction => new Transaction(transaction))
  }

  /**
   * Determine transactions that need to be broadcasted
   * @param  {Boolean} broadcasted - if true transactions was send from node2node, if false - is from client
   * @return {void}
   */
  __determineTransactionsForBroadCast (isBroadCasted) {
    this.transactions.forEach(transaction => {
      if (!isBroadCasted) {
        // transaction.hops = 0 //TODO: rething if we need to count hops, or just send trxses out once to all peers
        this.broadcast.push(transaction)
      }
    })
  }

  /**
   * Determine any transactions that do not match the accepted fee by delegate or max fee set by sender
   * Matched transactions stay in this.transaction, mis-matched transaction are pushed in this.invalid
   * @return {void}
   */
  __determineFeeMatchingTransactions () {
    const dynamicFeeResults = dynamicFeeMatch(this.transactions)
    this.transactions = dynamicFeeResults.feesMatching
    this.invalid.concat(dynamicFeeResults.invalidFees)
  }

  /**
   * Determine any invalid transactions, usually caused by invalid crypto or insufficient funds.
   * @return {void}
   */
  __determineInvalidTransactions () {
    this.transactions = reject(this.transactions, transaction => {
      // TODO: poolmanager change to that later on

      const wallet = container
      .resolvePlugin('blockchain')
      .database
      .walletManager
      .getWalletByPublicKey(transaction.senderPublicKey)

      const verified = wallet.canApply(transaction)

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
   * Reset all indices.
   * @return {void}
   */
  __reset () {
    this.transactions = []
    this.accept = []
    this.excess = []
    this.invalid = []
    this.broadcast = []
  }
}
