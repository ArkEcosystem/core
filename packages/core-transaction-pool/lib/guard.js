const reject = require('lodash/reject')
const container = require('@arkecosystem/core-container')
const { crypto, feeManager, dynamicFeeManager } = require('@arkecosystem/crypto')
const { Transaction } = require('@arkecosystem/crypto').models
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
   * @return {void}
   */
  __determineFeeMatchingTransactions () {
    const feeConstants = config.getConstants(container.resolvePlugin('blockchain').getLastBlock(true).height).fees
    this.transactions = this.transactions.filter(transaction => {
      if (!feeConstants.dynamic && transaction.fee !== feeManager.get(transaction.type)) {
        logger.debug(`Received transaction fee '${transaction.fee}' for '${transaction.id}' does not match static fee of '${feeManager.get(transaction.type)}'`)
        this.invalid.push(transaction)
        return false
      }

      if (feeConstants.dynamic) {
        const dynamicFee = dynamicFeeManager.calculateFee(config.delegates.dynamicFees.feeMultiplier, transaction)

        if (transaction.fee < config.delegates.dynamicFees.minAcceptableFee) {
          logger.debug(`Fee not accepted - transaction fee of '${transaction.fee}' for '${transaction.id}' is below delegate minimum fee of '${config.delegates.dynamicFees.minAcceptableFee}'`)

          this.invalid.push(transaction)
          return false
        }

        if (dynamicFee > transaction.fee) {
          logger.debug(`Fee not accepted - calculated delegate fee of '${dynamicFee}' is above maximum transcation fee of '${transaction.fee}' for '${transaction.id}'`)

          this.invalid.push(transaction)
          return false
        }

        if (transaction.fee > feeManager.get(transaction.type)) {
          logger.debug(`Fee not accepted - transaction fee of '${transaction.fee}' for '${transaction.id}' is above static fee of '${feeManager.get(transaction.type)}'`)

          this.invalid.push(transaction)
          return false
        }

        logger.debug(`Transaction accepted with fee of '${transaction.fee}' for '${transaction.id}' - calculated fee for transaction is '${dynamicFee}'`)
      }

      return true
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
    this.broadcast = []
  }
}
