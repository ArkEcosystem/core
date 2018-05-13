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
    if (!this.options.enabled) {
      logger.warn('Redis transaction pool disabled - please enable if run in production')

      return this
    }

    this.pool = null
    this.subscription = null
    this.keyPrefix = this.options.key
    this.counters = {}
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

    this.subscription.on('message', (channel, message) => {
      logger.debug(`Received expiration message ${message} from channel ${channel}`)
      this.removeTransactionById(message.split(':')[2])
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
   * Add a transaction to the pool.
   * @param {(Transaction|void)} transaction
   */
  async addTransaction (transaction) {
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "addTransaction".')
    }

    if (!(transaction instanceof Transaction)) {
      return logger.warn(`Discarded Transaction ${transaction} - Invalid object.`)
    }

    try {
      const senderPublicKey = transaction.data.senderPublicKey
      await this.pool.hmset(
        this.__getRedisTransactionKey(transaction.data.id),
        'serialized', transaction.serialized.toString('hex'),
        'timestamp', transaction.data.timestamp,
        'expiration', transaction.data.expiration,
        'senderPublicKey', senderPublicKey,
        'timelock', transaction.data.timelock,
        'timelocktype', transaction.data.timelocktype
      )
      await this.pool.rpush(this.__getRedisOrderKey(), transaction.data.id)
      await this.pool.rpush(this.__getRedisKeyByPublicKey(senderPublicKey), transaction.data.id)

      if (transaction.data.expiration > 0) {
        await this.pool.expire(this.__getRedisTransactionKey(transaction.data.id), transaction.data.expiration - transaction.data.timestamp)
      }
    } catch (error) {
      logger.error('Could not add transaction to Redis', error, error.stack)
    }
  }

  /**
   * Add many transaction to the pool.
   * @param {Array}   transactions
   * @param {Boolean} isBroadcast
   */
  addTransactions (transactions, isBroadcast) {
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "addTransactions".')
    }

    return transactions.map(transaction => {
      transaction = new Transaction(transaction)
      transaction.isBroadcast = isBroadcast

      this.addTransaction(transaction)

      if (isBroadcast) {
        super.broadcastTransaction(transaction)
      }

      return transaction
    })
  }

  /**
   * Remove a transaction from the pool by transaction object.
   * @param  {Transaction} transaction
   * @return {void}
   */
  async removeTransaction (transaction) {
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "removeTransaction".')
    }

    await this.pool.lrem(this.__getRedisOrderKey(), 1, transaction.data.id)
    await this.pool.lrem(this.__getRedisKeyByPublicKey(transaction.data.senderPublicKey), 1, transaction.data.id)
    await this.pool.del(this.__getRedisTransactionKey(transaction.data.id))
  }

  /**
   * Remove a transaction from the pool by id.
   * @param  {Number} id
   * @return {void}
   */
  async removeTransactionById (id) {
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "removeTransactionById".')
    }

    const publicKey = await this.getPublicKeyById(id)
    await this.pool.lrem(this.__getRedisOrderKey(), 1, id)
    await this.pool.lrem(this.__getRedisKeyByPublicKey(publicKey), 1, id)
    await this.pool.del(this.__getRedisTransactionKey(id))
  }

  /**
   * Remove multiple transactions from the pool.
   * @param  {Array} transactions
   * @return {void}
   */
  async removeTransactions (transactions) {
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "removeTransactions".')
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
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "hasExceededMaxTransactions".')
    }

    const count = await this.pool.llen(this.__getRedisKeyByPublicKey(transaction.senderPublicKey))

    return count >= this.options.maxTransactionsPerSender
  }

  /**
   * Get a sender public key by transaction id.
   * @param  {Number} id
   * @return {(String|void)}
   */
  async getPublicKeyById (id) {
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "getPublicKeyById".')
    }

    return this.pool.hget(this.__getRedisTransactionKey(id), 'senderPublicKey')
  }

  /**
   * Get a transaction by transaction id.
   * @param  {Number} id
   * @return {(Transaction|String|void)}
   */
  async getTransaction (id) {
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "getTransaction".')
    }

    const serialized = await this.pool.hget(this.__getRedisTransactionKey(id), 'serialized')

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
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "getTransactions".')
    }

    try {
      const transactionIds = await this.pool.lrange(this.__getRedisOrderKey(), start, start + size - 1)

      let transactions = []
      for (const id of transactionIds) {
        const serializedTransaction = await this.pool.hmget(this.__getRedisTransactionKey(id), 'serialized')
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
    if (!this.__isReady()) {
      return logger.warn('Transaction Pool is disabled - discarded action "getTransactionsForForging".')
    }

    try {
      let transactionIds = await this.pool.lrange(this.__getRedisOrderKey(), start, start + size - 1)
      transactionIds = await this.removeForgedAndGetPending(transactionIds)

      let transactions = []
      for (const id of transactionIds) {
        const transaction = await this.pool.hmget(this.__getRedisTransactionKey(id), 'serialized', 'expiration', 'timelock', 'timelocktype')

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
   * Flush the pool.
   * @return {void}
   */
  async flush () {
    const keys = await this.pool.keys('*')

    keys.forEach(key => this.pool.del(key))
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
   * Get the Redis key for the transactions associated with a public key.
   * @param  {String} publicKey
   * @return {String}
   */
  __getRedisKeyByPublicKey (publicKey) {
    return `${this.keyPrefix}:publicKey:${publicKey}`
  }

  /**
   * Determine if the pool and subscription are connected.
   * @return {Boolean}
   */
  __isReady () {
    return this.pool && this.pool.status === 'ready'
  }
}
