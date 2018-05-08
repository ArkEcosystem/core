'use strict'

const { TransactionPoolInterface } = require('@arkecosystem/core-transaction-pool')
const Redis = require('ioredis')

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const blockchain = container.resolvePlugin('blockchain')

const client = require('@arkecosystem/client')
const { slots } = client
const { Transaction } = client.models

module.exports = class TransactionPool extends TransactionPoolInterface {
  /**
   * Make the transaction pool instance.
   * @return {TransactionPool}
   */
  make () {
    this.redis = null
    this.subscription = null
    if (this.options.enabled) {
      this.redis = new Redis(this.options.redis)
      this.subscription = new Redis(this.options.redis)
    }

    this.isConnected = false
    this.keyPrefix = this.options.key
    this.counters = {}

    if (this.redis) {
      this.redis.on('connect', () => {
        logger.info('Redis connection established')
        this.isConnected = true
        this.redis.config('set', 'notify-keyspace-events', 'Ex')
        this.subscription.subscribe('__keyevent@0__:expired')
      })

      this.subscription.on('message', (channel, message) => {
        logger.debug(`Received expiration message ${message} from channel ${channel}`)
        this.removeTransaction(message.split('/')[3])
      })
    } else {
      logger.warn('Could not connect to Redis')
    }

    return this
  }

  /**
   * Disconnect from Redis.
   * @return {void}
   */
  async disconnect () {
    if (this.redis) this.redis.disconnect()
    if (this.subscription) this.subscription.disconnect()
  }

   /**
   * Get the number of transactions in the pool.
   * @return {Number}
   */
  async getPoolSize () {
    return this.isConnected ? this.redis.llen(this.__getRedisOrderKey()) : 0
  }

  /**
   * Add a transaction to the pool.
   * @param {(Transaction|void)} transaction
   */
  async addTransaction (transaction) {
    if (!this.isConnected || !(transaction instanceof Transaction)) {
      return
    }

    try {
      const senderPublicKey = transaction.data.senderPublicKey
      await this.redis.hmset(
        this.__getRedisTransactionKey(transaction.id),
        'serialized', transaction.serialized.toString('hex'),
        'timestamp', transaction.data.timestamp,
        'expiration', transaction.data.expiration,
        'senderPublicKey', senderPublicKey,
        'timelock', transaction.data.timelock,
        'timelocktype', transaction.data.timelocktype
      )
      await this.redis.rpush(this.__getRedisOrderKey(), transaction.id)
      await this.redis.rpush(this.__getRedisKeyByPublicKey(senderPublicKey), transaction.id)

      if (transaction.data.expiration > 0) {
        await this.redis.expire(this.__getRedisTransactionKey(transaction.id), transaction.data.expiration - transaction.data.timestamp)
      }
    } catch (error) {
      logger.error('Could not add transaction to Redis', error, error.stack)
    }
  }

  /**
   * Remove a transaction from the pool by transaction object.
   * @param  {Transaction} transaction
   * @return {void}
   */
  async removeTransaction (transaction) {
    if (this.isConnected) {
      await this.redis.lrem(this.__getRedisOrderKey(), 1, transaction.id)
      await this.redis.lrem(this.__getRedisKeyByPublicKey(transaction.data.senderPublicKey), 1, transaction.id)
      await this.redis.del(this.__getRedisTransactionKey(transaction.id))
    }
  }

  /**
   * Remove a transaction from the pool by id.
   * @param  {Number} id
   * @return {void}
   */
  async removeTransactionById (id) {
    if (!this.isConnected) {
      return
    }

    const publicKey = await this.getPublicKeyById(id)
    await this.redis.lrem(this.__getRedisOrderKey(), 1, id)
    await this.redis.lrem(this.__getRedisKeyByPublicKey(publicKey), 1, id)
    await this.redis.del(this.__getRedisTransactionKey(id))
  }

  /**
   * Remove multiple transactions from the pool.
   * @param  {Array} transactions
   * @return {void}
   */
  async removeTransactions (transactions) {
    if (!this.isConnected) {
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
   * @param  {String} address
   * @return {(Boolean|void)}
   */
  async hasExceededMaxTransactions (transaction) {
    if (!this.isConnected) {
      return
    }

    const count = await this.redis.llen(this.__getRedisKeyByPublicKey(transaction.senderPublicKey))

    return count >= this.options.maxTransactionsPerSender
  }

  /**
   * Get a sender public key by transaction id.
   * @param  {Number} id
   * @return {(String|void)}
   */
  async getPublicKeyById (id) {
    if (!this.isConnected) {
      return
    }

    return this.redis.hget(this.__getRedisTransactionKey(id), 'senderPublicKey')
  }

  /**
   * Get a transaction by transaction id.
   * @param  {Number} id
   * @return {(Transaction|String|void)}
   */
  async getTransaction (id) {
    if (!this.isConnected) {
      return
    }

    const serialized = await this.redis.hget(this.__getRedisTransactionKey(id), 'serialized')

    if (serialized) {
      return Transaction.fromBytes(serialized)
    }

    return 'Error: Non existing transaction'
  }

  /**
   * Get all transactions within the specified range.
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)}
   */
  async getTransactions (start, size) {
    if (!this.isConnected) {
      return
    }

    try {
      const transactionIds = await this.redis.lrange(this.__getRedisOrderKey(), start, start + size - 1)

      let transactions = []
      for (const id of transactionIds) {
        const serializedTransaction = await this.redis.hmget(this.__getRedisTransactionKey(id), 'serialized')
        serializedTransaction ? transactions.push(serializedTransaction[0]) : await this.removeTransaction(id)
      }

      return transactions
    } catch (error) {
      logger.error('Could not get transactions from Redis: ', error, error.stack)
    }
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)}
   */
  async getTransactionsForForging (start, size) {
    if (!this.isConnected) {
      return
    }

    try {
      let transactionIds = await this.redis.lrange(this.__getRedisOrderKey(), start, start + size - 1)
      transactionIds = await this.removeForgedAndGetPending(transactionIds)

      let transactions = []
      for (const id of transactionIds) {
        const transaction = await this.redis.hmget(this.__getRedisTransactionKey(id), 'serialized', 'expired', 'timelock', 'timelocktype')

        if (!transaction[0]) {
          await this.removeTransaction(id)
          break
        }

        if (transaction[2]) { // timelock is defined
          const actions = {
            0: () => { // timestamp lock defined
              if (parseInt(transaction[2]) <= slots.getTime()) {
                logger.debug(`Timelock for ${id} released - timestamp: ${transaction[2]}`)
                transactions.push(transaction[0])
              }
            },
            1: () => { // block height time lock
              if (parseInt(transaction[2]) <= blockchain.getLastBlock(true).height) {
                logger.debug(`Timelock for ${id} released - block height: ${transaction[2]}`)
                transactions.push(transaction[0])
              }
            }
          }

          actions[parseInt(transaction[3])]()
        } else {
          transactions.push(transaction[0])
        }
      }

      return transactions
    } catch (error) {
      logger.error('Could not get transactions for forging from Redis: ', error, error.stack)
    }
  }

  /**
   * Get the Redis key for the given transaction.
   * @param  {Number} id
   * @return {String}
   */
  __getRedisTransactionKey (id) {
    return `${this.keyPrefix}/tx/${id}`
  }

  /**
   * Get the Redis key for the order of transactions.
   * @return {String}
   */
  __getRedisOrderKey () {
    return `${this.keyPrefix}/order`
  }

  /**
   * Get the Redis key for the transactions associated with a public key.
   * @param  {String} publicKey
   * @return {String}
   */
  __getRedisKeyByPublicKey (publicKey) {
    return `${this.keyPrefix}/publicKey/${publicKey}`
  }
}
