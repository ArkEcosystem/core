'use strict';

const Redis = require('ioredis')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')
const blockchainManager = pluginManager.get('blockchain')

const client = require('@arkecosystem/client')
const { slots } = client
const { Transaction } = client.models

let instance

module.exports = class TransactionPoolManager {
  /**
   * Create a new transaction pool manager instance.
   * @param  {Object} config
   * @return {TransactionPoolManager}
   */
  constructor (config) {
    this.isConnected = false
    this.keyPrefix = config.keyPrefix
    this.counters = {}

    this.redis = config.enabled ? new Redis(config.redis) : null
    this.redisSub = config.enabled ? new Redis(config.redis) : null

    const that = this
    if (this.redis) {
      this.redis.on('connect', () => {
        logger.info('Redis connection established.')
        that.isConnected = true
        that.redis.config('set', 'notify-keyspace-events', 'Ex')
        that.redisSub.subscribe('__keyevent@0__:expired')
      })

      this.redisSub.on('message', (channel, message) => {
        // logger.debug(`Receive message ${message} from channel ${channel}`)
        this.removeTransaction(message.split('/')[3])
      })
    } else {
      logger.warn('Transaction pool is disabled in settings')
    }

    if (!instance) {
      instance = this
    }
    return instance
  }

  /**
   * Get a transaction pool manager instance.
   * @return {TransactionPoolManager}
   */
  static getInstance () {
    return instance
  }

  /**
   * Get the number of transactions in the pool.
   * @return {Number}
   */
  async getPoolSize () {
    return this.isConnected ? this.redis.llen(this.__getRedisOrderKey()) : -1
  }

  /**
   * Add a transaction to the pool.
   * @param {Transaction} transaction
   */
  async addTransaction (transaction) {
    if (this.isConnected && transaction instanceof Transaction) {
      try {
        await this.redis.hmset(this.__getRedisTransactionKey(transaction.id), 'serialized', transaction.serialized.toString('hex'), 'timestamp', transaction.data.timestamp, 'expiration', transaction.data.expiration, 'senderPublicKey', transaction.data.senderPublicKey, 'timelock', transaction.data.timelock, 'timelocktype', transaction.data.timelocktype)
        await this.redis.rpush(this.__getRedisOrderKey(), transaction.id)

        if (transaction.data.expiration > 0) {
          await this.redis.expire(this.__getRedisTransactionKey(transaction.id), transaction.data.expiration - transaction.data.timestamp)
        }
      } catch (error) {
        logger.error('Error adding transaction to transaction pool error', error, error.stack)
      }
    }
  }

  /**
   * Remove a transaction.
   * @param  {Number} id
   * @return {void}
   */
  async removeTransaction (id) {
    await this.redis.lrem(this.__getRedisOrderKey(), 1, id)
    await this.redis.del(this.__getRedisTransactionKey(id))
  }

  /**
   * Remove multiple transactions.
   * @param  {Array} transactions
   * @return {void}
   */
  async removeTransactions (transactions) {
    try {
      for (let transaction of transactions) {
        await this.removeTransaction(transaction.id)
      }
    } catch (error) {
      logger.error(`Error removing forged transactions from pool ${error.stack}`)
    }
  }

  /**
   * Get a transaction.
   * @param  {Number} id
   * @return {(Transaction|String)}
   */
  async getTransaction (id) {
    if (this.isConnected) {
      const serialized = await this.redis.hget(this.__getRedisTransactionKey(id), 'serialized')
      if (serialized) {
        return Transaction.fromBytes(serialized)
      } else {
        return 'Error: Non existing transaction'
      }
    }
  }

  /**
   * Get all transactions within the specified range.
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array}
   */
  async getTransactions (start, size) {
    if (this.isConnected) {
      try {
        const transactionIds = await this.redis.lrange(this.__getRedisOrderKey(), start, start + size - 1)
        let retList = []
        for (const id of transactionIds) {
          const serTrx = await this.redis.hmget(this.__getRedisTransactionKey(id), 'serialized')
          serTrx ? retList.push(serTrx[0]) : await this.removeTransaction(id)
        }
        return retList
      } catch (error) {
        logger.error('Get Transactions items from redis pool: ', error)
        logger.error(error.stack)
      }
    }
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array}
   */
  async getTransactionsForForging (start, size) {
    if (this.isConnected) {
      try {
        let transactionIds = await this.redis.lrange(this.__getRedisOrderKey(), start, start + size - 1)
        transactionIds = await this.__checkIfForged(transactionIds)
        let retList = []
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
                  logger.debug(`Timelock for ${id} released timestamp=${transaction[2]}`)
                  retList.push(transaction[0])
                }
              },
              1: () => { // block height time lock
                if (parseInt(transaction[2]) <= blockchainManager.getState().lastBlock.data.height) {
                  logger.debug(`Timelock for ${id} released block height=${transaction[2]}`)
                  retList.push(transaction[0])
                }
              }
            }
            actions[parseInt(transaction[3])]()
          } else {
            retList.push(transaction[0])
          }
        }
        return retList
      } catch (error) {
        logger.error('Get transactions for forging from redis list: ', error)
        logger.error(error.stack)
      }
    }
  }

  /**
   * Checks if any of transactions for forging from pool was already forged and removes them from pool
   * It returns only the ids of transactions that have yet to be forged
   * @param  {Array} transactionIds
   * @return {Array}
   */
  async __checkIfForged (transactionIds) {
    const forgedIds = await blockchainManager.getDatabaseConnection().getForgedTransactionsIds(transactionIds)
    forgedIds.forEach(element => this.removeTransaction(element))
    return transactionIds.filter(id => forgedIds.indexOf(id) === -1)
  }

  /**
   * Get the redis key for the given transaction.
   * @param  {Number} id
   * @return {String}
   */
  __getRedisTransactionKey (id) {
    return `${this.keyPrefix}/tx/${id}`
  }

  /**
   * Get the redis key for the order of transactions.
   * @return {String}
   */
  __getRedisOrderKey () {
    return `${this.keyPrefix}/order`
  }
}
