'use strict'

const { TransactionPoolInterface } = require('@arkecosystem/core-transaction-pool')
const Redis = require('ioredis')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')
const uniq = require('lodash/uniq')

const ark = require('@arkecosystem/crypto')
const { Transaction } = ark.models
const { TRANSACTION_TYPES } = ark.constants
const database = container.resolvePlugin('database')

module.exports = class TransactionPool extends TransactionPoolInterface {
  /**
   * Make the transaction pool instance.
   * @return {TransactionPool}
   */
  make () {
    if (!this.options.enabled) {
      logger.warn('Redis transaction pool disabled - please enable if run in production')

      return this
    }

    this.keyPrefix = this.options.key
    this.pool = new Redis(this.options.redis)
    this.subscription = new Redis(this.options.redis)

    this.pool.on('connect', () => {
      logger.info('Redis connection established')

      this.pool.config('set', 'notify-keyspace-events', 'Ex')

      this.subscription.subscribe('__keyevent@0__:expired')
    })

    this.pool.on('error', () => {
      logger.error('Could not connect to Redis. If you do not wish to use the transaction pool, please disable it and restart, otherwise fix the issue.')
      process.exit(1)
    })

    this.subscription.on('message', async (channel, message) => {
      logger.debug(`Received expiration message ${message} from channel ${channel}`)
      if (message.split(':')[0] === this.keyPrefix) {
        const transactionId = message.split(':')[2]
        const transaction = await this.getTransaction(transactionId)

        emitter.emit('transaction.expired', transaction.data)

        this.walletManager.revertTransaction(transaction)
        await this.removeTransaction(transaction)
      }
    })

    return this
  }

  /**
   * Disconnect from Redis.
   * @return {void}
   */
  async disconnect () {
    try {
      if (this.pool) {
        await this.pool.disconnect()
      }
    } catch (error) {
      logger.warn('Connection already closed')
    }
    try {
      if (this.subscription) {
        await this.subscription.disconnect()
      }
    } catch (error) {
      logger.warn('Connection already closed')
    }
  }

  /**
   * Get the number of transactions in the pool.
   * @return {Number}
   */
  async getPoolSize () {
    return this.__isReady() ? this.pool.llen(this.__getRedisOrderKey()) : 0
  }

  /**
   * Get the number of transaction in the pool from specific sender
   * @param {String} senderPublicKey
   * @returns {Number}
   */
  async getSenderSize (senderPublicKey) {
    return this.pool.llen(this.__getRedisSenderPublicKey(senderPublicKey))
  }

  /**
   * Add a transaction to the pool.
   * @param {(Transaction|void)} transaction
   */
  async addTransaction (transaction) {
    if (!this.__isReady()) {
      return
    }

    if (!(transaction instanceof Transaction)) {
      logger.warn(`Discarded Transaction ${transaction} - Invalid object.`)
      return
    }

    if (await this.transactionExists(transaction.id)) {
      logger.debug(`Duplicated Transaction ${transaction.id} - Transaction already in pool.`)
      return
    }

    try {
      const res = await this.pool.hmset(this.__getRedisTransactionKey(transaction.id),
        'serialized', transaction.serialized.toString('hex'),
        'senderPublicKey', transaction.senderPublicKey
      )

      if (res === 0) {
        throw new Error('Transaction not added to the pool - await this.pool.hmset failed')
      }
      await this.pool.rpush(this.__getRedisOrderKey(), transaction.id)
      await this.pool.rpush(this.__getRedisSenderPublicKey(transaction.senderPublicKey), transaction.id)

      if (transaction.expiration > 0) {
        await this.pool.setex(this.__getRedisExpirationKey(transaction.id), transaction.expiration - transaction.timestamp, transaction.id)
      } else if (transaction.type !== TRANSACTION_TYPES.TIMELOCK_TRANSFER) {
        await this.pool.setex(this.__getRedisExpirationKey(transaction.id), this.options.maxTransactionAge, transaction.id)
      }
    } catch (error) {
      logger.error('Could not add transaction to Redis', error, error.stack)

      this.walletManager.revertTransaction(transaction)
    }
  }

  /**
   * Add many transaction to the pool.
   * @param {Array}   transactions, already transformed and verified by transaction guard - must have serialized field
   */
  async addTransactions (transactions) {
    if (!this.__isReady()) {
      return
    }

    await Promise.all(transactions.map(transaction => this.addTransaction(transaction)))
  }

  /**
   * Remove a transaction from the pool by transaction object.
   * @param  {Transaction} transaction
   * @return {void}
   */
  async removeTransaction (transaction) {
    if (!this.__isReady()) {
      return
    }

    if (await this.transactionExists(transaction.id)) {
      await this.pool.lrem(this.__getRedisOrderKey(), 0, transaction.id)
      await this.pool.lrem(this.__getRedisSenderPublicKey(transaction.senderPublicKey), 0, transaction.id)
      await this.pool.del([this.__getRedisExpirationKey(transaction.id), this.__getRedisTransactionKey(transaction.id)])
    }
  }

  /**
   * Remove a transaction from the pool by id.
   * @param  {Number} id
   * @return {void}
   */
  async removeTransactionById (id) {
    if (!this.__isReady()) {
      return
    }

    if (await this.transactionExists(id)) {
      const senderPublicKey = await this.pool.hget(this.__getRedisTransactionKey(id), 'senderPublicKey')

      await this.pool.lrem(this.__getRedisSenderPublicKey(senderPublicKey), 0, id)
      await this.pool.lrem(this.__getRedisOrderKey(), 0, id)
      await this.pool.del(this.__getRedisExpirationKey(id))
      await this.pool.del(this.__getRedisTransactionKey(id))
    }
  }

  /**
   * Remove multiple transactions from the pool.
   * @param  {Array} transactions
   * @return {void}
   */
  async removeTransactions (transactions) {
    if (!this.__isReady()) {
      return
    }

    try {
      for (let transaction of transactions) {
        await this.removeTransaction(transaction)
      }
    } catch (error) {
      logger.error('Could not remove transactions from Redis: ', error.stack)
    }
  }

  /**
   * Check whether sender of transaction has exceeded max transactions in queue.
   * @param  {String} transaction
   * @return {(Boolean|void)}
   */
  async hasExceededMaxTransactions (transaction) {
    if (!this.__isReady()) {
      return
    }

    if (this.options.allowedSenders.includes(transaction.senderPublicKey)) {
      logger.debug(`Transaction pool allowing ${transaction.senderPublicKey} senderPublicKey, thus skipping throttling.`)
      return false
    }

    const count = await this.pool.llen(this.__getRedisSenderPublicKey(transaction.senderPublicKey))
    return count ? count >= this.options.maxTransactionsPerSender : false
  }

  /**
   * Get a transaction by transaction id.
   * @param  {Number} id
   * @return {(Transaction|String|void)}
   */
  async getTransaction (id) {
    if (!this.__isReady()) {
      return
    }

    const serialized = await this.pool.hget(this.__getRedisTransactionKey(id), 'serialized')
    if (serialized) {
      return Transaction.fromBytes(serialized)
    }

    return undefined
  }

  /**
   * Removes any transactions in the pool that have already been forged.
   * @param  {Array} transactionIds
   * @return {Array} IDs of pending transactions that have yet to be forged.
   */
  async removeForgedAndGetPending (transactionIds) {
    const forgedIdsSet = new Set(await database.getForgedTransactionsIds(transactionIds))

    await Promise.all(forgedIdsSet, async (transactionId) => {
      await this.removeTransactionById(transactionId)
    })

    return transactionIds.filter(id => !forgedIdsSet.has(id))
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} blockSize
   * @return {(Array|void)}
   */
  async getTransactionsForForging (blockSize) {
    try {
      let transactionsIds = await this.getTransactionIdsForForging(0, 0)

      let transactions = []
      while (transactionsIds.length) {
        const id = transactionsIds.shift()
        const transaction = await this.getTransaction(id)

        if (!transaction || !this.checkDynamicFeeMatch(transaction) || !this.checkApplyToBlockchain(transaction)) {
          continue
        }

        transactions.push(transaction.serialized.toString('hex'))
        if (transactions.length === blockSize) {
          break
        }
      }

      return transactions
    } catch (error) {
      logger.error('Could not get transactions for forging from Redis: ', error, error.stack)
    }
  }

  /**
   * Get all transactions within the specified range.
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)}
   */
  async getTransactions (start, size) {
    if (!this.__isReady()) {
      return
    }

    try {
      const transactionIds = await this.pool.lrange(this.__getRedisOrderKey(), start, start + size - 1)

      let transactions = []
      for (const id of transactionIds) {
        const serializedTransaction = await this.pool.hmget(this.__getRedisTransactionKey(id), 'serialized')
        serializedTransaction ? transactions.push(serializedTransaction[0]) : await this.removeTransactionById(id)
      }

      return transactions
    } catch (error) {
      logger.error('Could not get transactions from Redis: ', error, error.stack)
    }
  }

  /**
   * Get all transactions within the specified range, removes already forged ones and possible duplicates
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)} array of transactions IDs in specified range
   */
  async getTransactionIdsForForging (start, size) {
    if (!this.__isReady()) {
      return
    }

    try {
      let transactionIds = await this.pool.lrange(this.__getRedisOrderKey(), start, start + size - 1)
      transactionIds = await this.removeForgedAndGetPending(transactionIds)

      return uniq(transactionIds)
    } catch (error) {
      logger.error('Could not get transactions IDs from Redis: ', error, error.stack)
    }
  }

  /**
   * Flush the pool.
   * @return {void}
   */
  async flush () {
    const keys = await this.pool.keys(`${this.keyPrefix}:*`)

    keys.forEach(key => this.pool.del(key))
  }

 /**
   * Remove all transactions from transaction pool belonging to specific sender
   * @param  {String} senderPublicKey
   * @return {void}
   */
  async removeTransactionsForSender (senderPublicKey) {
    const senderTransactionIds = await this.pool.lrange(this.__getRedisSenderPublicKey(senderPublicKey), 0, -1)

    for (let id of senderTransactionIds) {
      await this.removeTransactionById(id)
    }
  }

  /**
  * Checks if transaction exists in the pool
  * @param {transactionId}
  * @return {Boolean}
  */
  async transactionExists (transactionId) {
    const exists = await this.pool.hexists(this.__getRedisTransactionKey(transactionId), 'serialized')
    return (exists > 0)
  }

  /**
   * Get the Redis key for the given transaction.
   * @param  {Number} id
   * @return {String}
   */
  __getRedisTransactionKey (id) {
    return `${this.keyPrefix}:transactions:${id}`
  }

  /**
   * Get the Redis key for the order of transactions.
   * @return {String}
   */
  __getRedisOrderKey () {
    return `${this.keyPrefix}:order`
  }

  /**
   * Get the Redis key for the transactions expiration
   * @param  {String} publicKey
   * @return {String}
   */
  __getRedisExpirationKey (transactionId) {
    return `${this.keyPrefix}:expiration:${transactionId}`
  }

    /**
   * Get the Redis key for searching/counting transactions related to and public key
   * @param  {String} senderPublicKey
   * @return {String}
   */
  __getRedisSenderPublicKey (senderPublicKey) {
    return `${this.keyPrefix}:senderPublicKey:${senderPublicKey}`
  }

  /**
   * Determine if the pool and subscription are connected.
   * @return {Boolean}
   */
  __isReady () {
    return this.pool && this.pool.status === 'ready'
  }
}
