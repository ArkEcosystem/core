const container = require('@arkecosystem/core-container')
const crypto = require('@arkecosystem/crypto')
const { configManager, models: { Transaction }, constants: { TRANSACTION_TYPES } } = crypto
const isRecipientOnActiveNetwork = require('./utils/is-on-active-network')
const database = container.resolvePlugin('database')
const _ = require('lodash')
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
   * Validate the specified transactions.
   * ORDER of called functions is important
   * @param  {Array} transactions
   * @return {void}
   */
  async validate (transactions) {
    this.__transformAndFilterTransactions(_.uniqBy(transactions, 'id'))

    await this.__removeForgedTransactions()

    this.__determineValidTransactions()

    this.__determineExcessTransactions()

    this.__determineFeeMatchingTransactions()
  }

  /**
   * Invalidate the specified transactions with the given reason.
   * @param  {Object|Array} transactions
   * @param  {String} reason
   * @return {void}
   */
  invalidate (transactions, reason) {
    transactions = Array.isArray(transactions) ? transactions : [transactions]
    transactions.forEach(tx => {
      this.__pushError(tx, reason)
    })
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
  __transformAndFilterTransactions (transactions) {
    this.transactions = []

    transactions.forEach(transaction => {
      const exists = this.pool.transactionExists(transaction.id)

      if (!exists && !this.pool.isSenderBlocked(transaction.senderPublicKey)) {
        try {
          const trx = new Transaction(transaction)

          if (trx.verified) {
            this.transactions.push(trx)
          } else {
            this.__pushError(transaction, 'Transaction didn\'t pass the verification process.')
          }
        } catch (error) {
          this.__pushError(transaction, error.message)
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
        this.__pushError(transaction, 'Already forged.')
        return false
      }

      return true
    })
  }

  /**
   * Determines valid transactions by checking rules, according to:
   * - if recipient is on the same network
   * - if sender has enough funds
   * - if sender already has another transaction of the same type, for types that
   *   only allow one transaction at a time in the pool (e.g. vote)
   * Transaction that can be broadcasted are confirmed here
   */
  __determineValidTransactions () {
    this.transactions.forEach(transaction => {
      switch (transaction.type) {
      case TRANSACTION_TYPES.TRANSFER:
        if (!isRecipientOnActiveNetwork(transaction)) {
          this.__pushError(transaction, `Recipient ${transaction.recipientId} is not on the same network: ${configManager.get('pubKeyHash')}`)
          return
        }
        break
      case TRANSACTION_TYPES.SECOND_SIGNATURE:
      case TRANSACTION_TYPES.DELEGATE_REGISTRATION:
      case TRANSACTION_TYPES.VOTE:
        if (this.pool.senderHasTransactionsOfType(transaction.senderPublicKey, transaction.type)) {
          this.__pushError(transaction,
            `Sender ${transaction.senderPublicKey} already has a transaction of type ` +
            `'${TRANSACTION_TYPES.toString(transaction.type)}' in the pool`)
          return
        }
        break
      case TRANSACTION_TYPES.MULTI_SIGNATURE:
      case TRANSACTION_TYPES.IPFS:
      case TRANSACTION_TYPES.TIMELOCK_TRANSFER:
      case TRANSACTION_TYPES.MULTI_PAYMENT:
      case TRANSACTION_TYPES.DELEGATE_RESIGNATION:
      default:
        this.__pushError(transaction,
          'Invalidating transaction of unsupported type ' +
          `'${TRANSACTION_TYPES.toString(transaction.type)}'`)
        return
      }

      try {
        this.pool.walletManager.applyPoolTransaction(transaction)
      } catch (error) {
        this.__pushError(transaction, error.toString())
        return
      }

      this.broadcast.push(transaction)
    })
  }

  /**
   * Determine exccess transactions
   */
  __determineExcessTransactions () {
    for (let transaction of this.broadcast) {
      const hasExceeded = this.pool.hasExceededMaxTransactions(transaction)

      if (hasExceeded) {
        this.excess.push(transaction)
      } else {
        /**
         * We need to check this again after checking it in "__transformAndFilterTransactions"
         * because the state of the transaction pool could have changed since then
         * if concurrent requests are occurring via API.
         */
        const exists = this.pool.transactionExists(transaction.id)

        if (exists) {
          this.__pushError(transaction, 'Already exists in pool.')
        } else {
          this.accept.push(transaction)
        }
      }
    }
  }

  /**
   * Filtering out not matching dynamic fee transactions
   * Should be done as last step in the guard process to prevent spaming of the network with broadcasting
   */
  __determineFeeMatchingTransactions () {
    this.accept = this.accept.filter(transaction => {
      if (!dynamicFeeMatch(transaction)) {
        this.__pushError(transaction, 'Peer rejected the transaction because of not meeting the minimum accepted fee. It is still broadcasted to other peers.')
        return false
      }
      return true
    })
  }

  /**
   * Adds a transaction to the errors object. The transaction id is mapped to an
   * array of errors. There may be multiple errors associated with a transaction in
   * which case __pushError is called multiple times.
   * @param {Transaction} transaction
   * @param {String} error
   * @return {void}
   */
  __pushError (transaction, error) {
    if (!this.errors.hasOwnProperty(transaction.id)) {
      this.errors[transaction.id] = []
    }

    this.errors[transaction.id].push(error)

    // XXX O(this.invalid.some.length), can be O(1)
    if (!this.invalid.some(tx => tx.id === transaction.id)) {
      this.invalid.push(transaction)
    }
  }

  /**
   * Get a json object.
   * @return {Object}
   */
  toJson () {
    const data = this.getIds()
    delete data.transactions

    return {
      data,
      errors: Object.keys(this.errors).length > 0 ? this.errors : null
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
    this.errors = {}
  }
}
