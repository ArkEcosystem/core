'use strict';

const { TransactionPoolInterface } = require('@arkecosystem/core-transaction-pool')
const Redis = require('ioredis')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')
const blockchainManager = pluginManager.get('blockchain')

const client = require('@arkecosystem/client')
const { slots } = client
const { Transaction } = client.models

module.exports = class TransactionPool extends TransactionPoolInterface {
  /**
   * Make the transaction pool instance.
   * @return {TransactionPool}
   */
  make () {
    this.redis = this.options.enabled ? new Redis(this.options.redis) : null

    this.isConnected = false
    this.keyPrefix = this.options.key
    this.counters = {}

    // separate connection for callback event sync
    this.redisSub = this.options.enabled ? new Redis(this.options.redis) : null
    if (this.redis) {
      this.redis.on('connect', () => {
        logger.info('Redis connection established.')
        this.isConnected = true
        this.redis.config('set', 'notify-keyspace-events', 'Ex')
        this.redisSub.subscribe('__keyevent@0__:expired')
      })

      this.redisSub.on('message', (channel, message) => {
        logger.debug(`Receive expiration message ${message} from channel ${channel}`)
        this.removeTransaction(message.split('/')[3])
      })
    } else {
      logger.warn('Transaction pool is disabled - please enable if run in production')
    }

    return this
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
        logger.error('Problem adding transaction to transaction pool', error, error.stack)
      }
    }
  }

  /**
   * Remove a transaction.
   * @param  {Number} id
   * @return {void}
   */
  async removeTransaction (id) {
    if (this.isConnected) {
      await this.redis.lrem(this.__getRedisOrderKey(), 1, id)
      await this.redis.del(this.__getRedisTransactionKey(id))
    }
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
      logger.error(`Problem removing forged transactions from pool ${error.stack}`)
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
        logger.error('Get Transactions items from redis pool: ', error, error.stack)
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
        transactionIds = await this.CheckIfForged(transactionIds)
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
                  logger.debug(`Timelock for ${id} released - timestamp: ${transaction[2]}`)
                  retList.push(transaction[0])
                }
              },
              1: () => { // block height time lock
                if (parseInt(transaction[2]) <= blockchainManager.getState().lastBlock.data.height) {
                  logger.debug(`Timelock for ${id} released - block height: ${transaction[2]}`)
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
        logger.error('Problem getting transactions for forging from redis list: ', error, error.stack)
      }
    }
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
