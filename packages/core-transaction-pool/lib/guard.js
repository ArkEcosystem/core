/* eslint max-len: "off" */

const container = require('@arkecosystem/core-container')
const crypto = require('@arkecosystem/crypto')

const {
  configManager,
  constants: { TRANSACTION_TYPES },
  models: { Transaction },
  slots,
} = crypto
const isRecipientOnActiveNetwork = require('./utils/is-on-active-network')

const dynamicFeeMatch = require('./utils/dynamicfee-matcher')

module.exports = class TransactionGuard {
  /**
   * Create a new transaction guard instance.
   * @param  {TransactionPoolInterface} pool
   * @return {void}
   */
  constructor(pool) {
    this.pool = pool

    this.transactions = []
    this.accept = []
    this.excess = []
    this.invalid = new Map()
    this.broadcast = []
    this.errors = {}
  }

  /**
   * Validate the specified transactions.
   * @param  {Array} transactions
   * @return {
   *   accept: array of transactions that qualify for entering the pool
   *   broadcast: array of transactions that qualify for broadcasting
   *   excess: array of transactions that exceed sender's quota in the pool
   *   invalid: array of invalid transactions
   *   errors: Object with
   *     keys=transaction id (for each element in invalid[]),
   *     value=[ { type, message }, ... ]
   * }
   */
  async validate(transactionsJson) {
    // Remove entries with the same `id`.
    transactionsJson = Array.from((new Map(transactionsJson.map(t => [ t.id, t ]))).values())

    // Convert from plain Object (JSON) to Transaction,
    // remove crypto invalid, already in pool, from blocked sender.
    let transactions = this.__transformAndFilterTransactions(transactionsJson)

    transactions = await this.__removeForgedTransactions(transactions)

    // Remove transactions with invalid recipient, insufficient funds, already vote.
    const valid = this.__determineValidTransactions(transactions)

    // Split excess transactions.
    const { accept, excess } = this.__determineExcessTransactions(valid)

    // Remove transactions with too low fee to enter the pool.
    const acceptWithoutLowFees = this.__determineFeeMatchingTransactions(accept)

    // Remove transactions with too low fee for broadcast.
    const broadcast = this.__removeTooLowFeesToBroadcast(valid)

    return {
      accept: acceptWithoutLowFees,
      broadcast,
      excess,
      invalid: Array.from(this.invalid.values()),
      errors: Object.keys(this.errors).length > 0 ? this.errors : null,
    }
  }

  /**
   * Transforms and filters incoming transactions.
   * It skips:
   * - transactions already in the pool
   * - not valid crypto transactions
   * - transactions from blocked senders
   * - transactions from the future
   * @param  {Array} transactions
   * @return {Array}
   */
  __transformAndFilterTransactions(transactions) {
    const result = []

    transactions.forEach(transaction => {
      const exists = this.pool.transactionExists(transaction.id)
      const now = slots.getTime()

      if (exists) {
        this.pool.pingTransaction(transaction.id)

        this.__pushError(transaction, 'ERR_DUPLICATE', `Duplicate transaction ${transaction.id}`)
      } else if (this.pool.isSenderBlocked(transaction.senderPublicKey)) {
        this.__pushError(
          transaction,
          'ERR_SENDER_BLOCKED',
          `Transaction ${transaction.id} rejected. Sender ${
            transaction.senderPublicKey
          } is blocked.`,
        )
      } else if (transaction.timestamp > now + 3600) {
        const secondsInFuture = transaction.timestamp - now
        this.__pushError(
          transaction,
          'ERR_FROM_FUTURE',
          `Transaction ${transaction.id} is ${secondsInFuture} seconds in the future`,
        )
      } else {
        try {
          const trx = new Transaction(transaction)

          if (trx.verified) {
            result.push(trx)
          } else {
            this.__pushError(
              transaction,
              'ERR_BAD_DATA',
              "Transaction didn't pass the verification process.",
            )
          }
        } catch (error) {
          this.__pushError(transaction, 'ERR_UNKNOWN', error.message)
        }
      }
    })

    return result
  }

  /**
   * Remove already forged transactions.
   * @return {Array}
   */
  async __removeForgedTransactions(transactions) {
    const database = container.resolvePlugin('database')

    const transactionIds = transactions.map(transaction => transaction.id)
    const forgedIdsSet = new Set(
      await database.getForgedTransactionsIds(transactionIds),
    )

    return transactions.filter(transaction => {
      if (forgedIdsSet.has(transaction.id)) {
        this.__pushError(transaction, 'ERR_FORGED', 'Already forged.')
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
   */
  __determineValidTransactions(transactions) {
    const result = []

    transactions.forEach(transaction => {
      switch (transaction.type) {
        case TRANSACTION_TYPES.TRANSFER:
          if (!isRecipientOnActiveNetwork(transaction)) {
            this.__pushError(
              transaction,
              'ERR_INVALID_RECIPIENT',
              `Recipient ${
                transaction.recipientId
              } is not on the same network: ${configManager.get('pubKeyHash')}`,
            )
            return
          }
          break
        case TRANSACTION_TYPES.SECOND_SIGNATURE:
        case TRANSACTION_TYPES.DELEGATE_REGISTRATION:
        case TRANSACTION_TYPES.VOTE:
          if (
            this.pool.senderHasTransactionsOfType(
              transaction.senderPublicKey,
              transaction.type,
            )
          ) {
            this.__pushError(
              transaction,
              'ERR_PENDING',
              `Sender ${
                transaction.senderPublicKey
              } already has a transaction of type ` +
                `'${TRANSACTION_TYPES.toString(transaction.type)}' in the pool`,
            )
            return
          }
          break
        case TRANSACTION_TYPES.MULTI_SIGNATURE:
        case TRANSACTION_TYPES.IPFS:
        case TRANSACTION_TYPES.TIMELOCK_TRANSFER:
        case TRANSACTION_TYPES.MULTI_PAYMENT:
        case TRANSACTION_TYPES.DELEGATE_RESIGNATION:
        default:
          this.__pushError(
            transaction,
            'ERR_UNSUPPORTED',
            'Invalidating transaction of unsupported type ' +
              `'${TRANSACTION_TYPES.toString(transaction.type)}'`,
          )
          return
      }

      try {
        this.pool.walletManager.applyPoolTransaction(transaction)
      } catch (error) {
        this.__pushError(transaction, 'ERR_UNKNOWN', error.toString())
        return
      }

      result.push(transaction)
    })

    return result
  }

  /**
   * Determine exccess transactions, that exceed sender's quota.
   */
  __determineExcessTransactions(transactions) {
    const accept = []
    const excess = []
    for (const t of transactions) {
      if (this.pool.hasExceededMaxTransactions(t)) {
        excess.push(t)
        this.pool.walletManager.revertTransaction(t)
      } else {
        accept.push(t)
      }
    }
    return { accept, excess }
  }

  /**
   * Remove transactions with too low fees to enter the pool.
   */
  __determineFeeMatchingTransactions(transactions) {
    return transactions.filter(t => {
      if (dynamicFeeMatch(t).enterPool) {
        return true
      }

      this.__pushError(t, 'ERR_LOW_FEE', 'Too low fee to be accepted in the pool')
      this.pool.walletManager.revertTransaction(t)
      return false
    })
  }

  /**
   * Remove transactions that have too low fee for broadcasting.
   */
  __removeTooLowFeesToBroadcast(transactions) {
    return transactions.filter(t => {
      if (dynamicFeeMatch(t).broadcast) {
        return true
      }

      this.__pushError(t, 'ERR_LOW_FEE', 'Too low fee for broadcast')
      return false
    })
  }

  /**
   * Adds a transaction to the errors object. The transaction id is mapped to an
   * array of errors. There may be multiple errors associated with a transaction in
   * which case __pushError is called multiple times.
   * @param {Transaction} transaction
   * @param {String} type
   * @param {String} message
   * @return {void}
   */
  __pushError(transaction, type, message) {
    if (!this.errors[transaction.id]) {
      this.errors[transaction.id] = []
    }

    this.errors[transaction.id].push({ type, message })

    this.invalid.set(transaction.id, transaction)
  }
}
