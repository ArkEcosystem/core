const Promise = require('bluebird')
const container = require('@arkecosystem/core-container')
const { Transaction } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const isRecipientOnActiveNetwork = require('./utils/is-on-active-network')
const database = container.resolvePlugin('database')
const _ = require('lodash')

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
   * ORDER of called functions is important
   * @param  {Array} transactions
   * @return {void}
   */
  async validate (transactions) {
    await this.__transformAndFilterTransations(_.uniqBy(transactions, 'id'))

    await this.__removeForgedTransactions()

    await this.__determineValidTransactions()

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
    return this[type].length === count
  }

  /**
   * Check if there are at least N transactions of the specified type.
   * @param  {String}  type
   * @param  {Number}  count
   * @return {Boolean}
   */
  hasAtLeast (type, count) {
    return this[type].length >= count
  }

  /**
   * Check if there are any transactions of the specified type.
   * @param  {String}  type
   * @return {Boolean}
   */
  hasAny (type) {
    return !!this[type].length
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

        if (trx.verified) {
          this.transactions.push(trx)
        }
      }
    })
  }

  /**
   * Skipping already forged transactions
   * @return {void}
   */
  async __removeForgedTransactions () {
    const transactionIds = this.transactions.map(transaction => transaction.id)
    const forgedIdsSet = new Set(await database.getForgedTransactionsIds(transactionIds))

    this.transactions = this.transactions.filter(transaction => {
      if (forgedIdsSet.has(transaction.id)) {
        this.invalid.push(transaction)
        return false
      }

      return true
    })
  }

  /**
   * Determines valid transactions by checking rules, according to:
   * - if recipient is on the same network
   * - if sender has enough funds
   * Transaction that can be broadcasted are confirmed here
   */
  async __determineValidTransactions () {
    await Promise.each(this.transactions, async (transaction) => {
      if (transaction.type === TRANSACTION_TYPES.TRANSFER) {
        if (!isRecipientOnActiveNetwork(transaction)) {
          this.invalid.push(transaction)

          return
        }
      }

      try {
        await this.pool.walletManager.applyPoolTransaction(transaction)
      } catch (error) {
        this.invalid.push(transaction)
        return
      }

      this.broadcast.push(transaction)
    })
  }

  /**
   * Determine exccess transactions
   */
  async __determineExcessTransactions () {
    for (let transaction of this.broadcast) {
      const hasExceeded = await this.pool.hasExceededMaxTransactions(transaction)

      if (hasExceeded) {
        this.excess.push(transaction)
      } else {
        /**
         * We need to check this again after checking it in "__transformAndFilterTransations"
         * because the state of the transaction pool could have changed since then
         * if concurrent requests are occurring via API.
         */
        const exists = await this.pool.transactionExists(transaction.id)

        if (exists) {
          this.invalid.push(transaction)
        } else {
          this.accept.push(transaction)
        }
      }
    }
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
