const Promise = require('bluebird')
const container = require('@arkecosystem/core-container')
const { Transaction } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const dynamicFeeMatch = require('./utils/dynamicfee-matcher')
const helpers = require('./utils/validation-helpers')
const database = container.resolvePlugin('database')

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
   * @return {void}
   */
  async validate (transactions) {
    this.__reset()

    await this.__transformAndFilterTransations(transactions)

    await this.__removeForgedTransactions()

    this.__determineFeeMatchingTransactions()

    await this.__determineValidTransactions()
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
      broadcast: this.invalid.map(transaction => transaction.id)
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
   * Transforms and filters incomming transactions.
   * It skips duplicates and not valid crypto transactions
   * It skips blocked senders
   * @param  {Array} transactions
   * @return {void}
   */
  async __transformAndFilterTransations (transactions) {
    this.transactions = []
    await Promise.each(transactions, async (transaction) => {
      const exists = await this.pool.transactionExists(transaction.id)

      if (!exists && !this.pool.isSenderBlocked(transaction.senderPublicKey)) {
        const trx = new Transaction(transaction)
        if (trx.verified) this.transactions.push(new Transaction(transaction))
      }
    })
  }

  /**
   * Skipping already forged transactions
   * @return {void}
   */
  async __removeForgedTransactions () {
    const transactionIds = this.transactions.map(transaction => transaction.id)
    const forgedIds = await database.getForgedTransactionsIds(transactionIds)

    this.transactions = this.transactions.filter(transaction => {
      if (forgedIds.indexOf(transaction.id) === -1) {
        this.broadcast.push(transaction)
        return true
      }
      this.invalid.push(this.transactions)
      return false
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
   * Determines valid transactions by checking rules, according to:
   * - if sender is over transaction pool limit
   * - if sender has enough funds
   * - if recipient is on the same network
   */
  async __determineValidTransactions () {
    await Promise.each(this.transactions, async (transaction) => {
      if (transaction.type === TRANSACTION_TYPES.TRANSFER) {
        if (!helpers.isRecipientOnActiveNetwork(transaction)) {
          this.invalid.push(transaction)
          return
        }
     }
      console.log(transaction)
      const hasExceeded = await this.pool.hasExceededMaxTransactions(transaction)
      if (hasExceeded) {
        this.excess.push(transaction)
        return
      }

      try {
        await this.pool.walletManager.applyTransaction(transaction)
      } catch (error) {
        this.invalid.push(transaction)
        console.log(error)

        return
      }
      console.log('ACCEPTED')
      this.accept.push(transaction)
    })
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
