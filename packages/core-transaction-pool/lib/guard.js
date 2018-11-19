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
   * Validate the specified transactions and accepted transactions to the pool.
   * @param  {Array} transactions
   * @return Object {
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
    transactionsJson = Array.from(
      new Map(transactionsJson.map(t => [t.id, t])).values(),
    )

    // Filter transactions and create Transaction instances from accepted ones
    const result = this.__filterAndTransformTransactions(transactionsJson)

    // Remove already forged tx... Not optimal here
    result.accept = await this.__removeForgedTransactions(result.accept)

    // Add transactions to the pool
    this.__addTransactionsToPool(result)

    return {
      accept: result.accept,
      broadcast: result.broadcast,
      excess: result.excess,
      invalid: Array.from(this.invalid.values()),
      errors: Object.keys(this.errors).length > 0 ? this.errors : null,
    }
  }

  /**
   * Transforms and filters incoming transactions.
   * It skips:
   * - transactions already in the pool
   * - transactions from blocked senders
   * - transactions from the future
   * - dynamic fee mismatch
   * - transactions based on type specific restrictions
   * - not valid crypto transactions
   * @param  {Array} transactions
   * @return {Array}
   */
  __filterAndTransformTransactions(transactions) {
    const result = {
      accept: [],
      broadcast: [],
      excess: [],
    }

    transactions.forEach(transaction => {
      const exists = this.pool.transactionExists(transaction.id)

      if (exists) {
        this.pool.pingTransaction(transaction.id)
        this.__pushError(
          transaction,
          'ERR_DUPLICATE',
          `Duplicate transaction ${transaction.id}`,
        )
      } else if (this.pool.isSenderBlocked(transaction.senderPublicKey)) {
        this.__pushError(
          transaction,
          'ERR_SENDER_BLOCKED',
          `Transaction ${transaction.id} rejected. Sender ${
            transaction.senderPublicKey
          } is blocked.`,
        )
      } else if (this.pool.hasExceededMaxTransactions(transaction)) {
        result.excess.push(transaction)
      } else if (this.__validateTransaction(transaction)) {
        const dynamicFee = dynamicFeeMatch(transaction)
        if (dynamicFee.enterPool) {
          try {
            const trx = new Transaction(transaction)

            if (trx.verified) {
              result.accept.push(trx)

              if (dynamicFee.broadcast) {
                result.broadcast.push(trx)
              } else {
                this.__pushError(
                  transaction,
                  'ERR_LOW_FEE',
                  'Too low fee for broadcast',
                )
              }
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
        } else {
          this.__pushError(
            transaction,
            'ERR_LOW_FEE',
            'Too low fee to be accepted in the pool',
          )
        }
      }
    })

    return result
  }

  /**
   * Determines valid transactions by checking rules, according to:
   * - transaction timestamp
   * - transaction type specifics:
   *    - if recipient is on the same network
   *    - if sender already has another transaction of the same type, for types that
   *    - only allow one transaction at a time in the pool (e.g. vote)
   */
  __validateTransaction(transaction) {
    const now = slots.getTime()
    if (transaction.timestamp > now + 3600) {
      const secondsInFuture = transaction.timestamp - now
      this.__pushError(
        transaction,
        'ERR_FROM_FUTURE',
        `Transaction ${
          transaction.id
        } is ${secondsInFuture} seconds in the future`,
      )
      return false
    }

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
          return false
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
          return false
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
        return false
    }

    return true
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
   * Add accepted transactions to the pool and return rejected ones.
   * @param {Object} result object containing the transactions
   */
  __addTransactionsToPool(result) {
    // Add transactions to the transaction pool
    const { added, notAdded } = this.pool.addTransactions(result.accept)

    // Filter not accepted tx
    result.accept = result.accept.filter(accepted => added.includes(accepted))

    // Only broadcast accepted transactions
    result.broadcast = result.broadcast.filter(broadcast =>
      result.accept.includes(broadcast),
    )

    // Add errors
    notAdded.forEach(error =>
      this.__pushError(error.transaction, error.type, error.message),
    )
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
