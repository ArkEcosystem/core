const reject = require('lodash/reject')
const container = require('@arkecosystem/core-container')
const { crypto, feeManager, dynamicFeeManager } = require('@arkecosystem/client')
const { Transaction } = require('@arkecosystem/client').models
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')

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
     this.transactions = transactions.map(transaction => new Transaction(transaction))
  }

  /**
   * Determine any transactions that do not match the accepted fee by delegate  or max fee set by sender
   * @return {void}
   */
  __determineFeeMatchingTransactions () {
    const feeConstants = config.getConstants(container.resolvePlugin('blockchain').getLastBlock(true).height).fees
    this.transactions = reject(this.transactions, transaction => {
      if (transaction.fee !== feeManager.get(transaction.type) && !feeConstants.dynamicFeeCalculation) {
        logger.warn(`Received transaction fee ${transaction.fee} is not according to default static specified fee ${feeManager.get(transaction.type)}`)
        this.invalid.push(transaction)
        return true
      }

      if (feeConstants.dynamicFeeCalculation) {
        const dynamicFee = dynamicFeeManager.calculateFee(config.delegates.dynamicFees.feeConstantMultiplier, transaction)
        if (dynamicFee > transaction.fee) {
          this.invalid.push(transaction)
          logger.verbose(`Fee not accepted. Delegate requests minimum payment of  ${dynamicFee} ARKTOSHI fee for transaction ${transaction.id}`)
          return true
        }

        if (transaction.fee < config.delegates.dynamicFees.minAcceptableFee) {
          this.invalid.push(transaction)
          logger.verbose(`Fee not accepted. Sender fee bellow threshold of accepted fee ${transaction.fee} < ${config.delegates.dynamicFees.minAcceptableFee}`)
          return true
        }

        if (transaction.fee > feeManager.get(transaction.type)) {
          this.invalid.push(transaction)
          logger.verbose(`Fee not accepted. Sender error, his own fee is HIGHER then default static specified fee ${feeManager.get(transaction.type)}`)
          return true
        }

        logger.verbose(`Transaction accepted. Dynamic fees active. Calculated fee for transaction ${transaction.id}: ${dynamicFee} ARKTOSHI.`)
        return false
      }

      return false
    })
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
    const wallet = container
      .resolvePlugin('blockchain')
      .database
      .walletManager
      .getWalletByPublicKey(transaction.senderPublicKey)

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
