const Redis = require('ioredis')
const logger = require('app/core/logger')
const Transaction = require('app/models/transaction')

let instance = null

module.exports = class RedisManager {
  static getInstance () {
    return instance
  }
  constructor (config) {
    this.isConnected = false
    this.keyPrefix = config.server.transactionPool.keyPrefix
    this.config = config
    this.counters = {}

    this.redis = this.config.server.transactionPool.enabled ? new Redis(this.config.server.redis) : null
    this.redisSub = this.config.server.transactionPool.enabled ? new Redis(this.config.server.redis) : null

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

  async getPoolSize () {
    return this.isConnected ? this.redis.llen(this.__getRedisOrderKey()) : -1
  }

  async add (object) {
    if (this.isConnected && object instanceof Transaction) {
      try {
        await this.redis.hset(this.__getRedisTransactionKey(object.id), 'serialized', object.serialized.toString('hex'), 'timestamp', object.data.timestamp, 'expiration', object.data.expiration, 'senderPublicKey', object.data.senderPublicKey, 'timeLock', object.data.timelock)
        await this.redis.rpush(this.__getRedisOrderKey(), object.id)

        if (object.data.expiration > 0) {
          await this.redis.expire(this.__getRedisTransactionKey(object.id), object.data.expiration - object.data.timestamp)
        }
      } catch (error) {
        logger.error('Error adding transaction to transaction pool error')
        logger.error(error.stack)
      }
    }
  }

  async removeTransaction (txID) {
    await this.redis.lrem(this.__getRedisOrderKey(), 1, txID)
    await this.redis.del(this.__getRedisTransactionKey(txID))
  }

  async removeTransactions (transactions) {
    try {
      for (let transaction of transactions) {
        // logger.debug(`Removing forged transaction ${transaction.id} from redis pool`)
        await this.removeTransaction(transaction.id)
      }
    } catch (error) {
      logger.error(`Error removing forged transactions from pool ${error.stack}`)
    }
  }

  async getTransactions (start, size) {
    if (this.isConnected) {
      try {
        const transactionIds = await this.redis.lrange(this.__getRedisOrderKey(), start, start + size - 1)
        let retList = []
        for (const id of transactionIds) {
          const serTrx = await this.redis.hget(this.__getRedisTransactionKey(id), 'serialized')
          serTrx ? retList.push(serTrx) : await this.removeTransaction(id)
        }
        return retList
      } catch (error) {
        logger.error('Get serialized items from redis list: ', error)
        logger.error(error.stack)
      }
    }
  }

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

  __getRedisTransactionKey (id) {
    return `${this.keyPrefix}/tx/${id}`
  }

  __getRedisOrderKey () {
    return `${this.keyPrefix}/order`
  }
}
