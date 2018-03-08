const Redis = require('ioredis')
const logger = require('app/core/logger')

let instance = null
module.exports = class TransactionPool {
  constructor (Class, config, log = false) {
    if (!instance) {
      instance = this
    } else {
      throw new Error('Cannot initialize two instances of memory pool...');
    }
    this.redis = config.server.txpool ? new Redis(config.server.txpool.port, config.server.txpool.host) : new Redis()
    this.key = config.server.txpool ? config.server.txpool.key : 'ark/pool'
    if (log) {
      logger.init(config.server.logging, config.network.name + '_memoryTxPool')
    }

    if (Class === undefined) {
      throw new Error('MemoryPool must be initilized with correct type to store it...');
    }

    if (typeof Class !== 'function') {
      throw new Error(`${Class} is not a function`)
    }

    this.Class = Class
    logger.info('Memory pool initialized')
  }

  async size () {
    return this.redis.llen(this.key)
  }

  async removeForgedTransactions (blockTransactions) {
    try {
      for (let tx of blockTransactions) {
        const serialized = await this.redis.hget(`${this.key}/tx:${tx.id}`, 'serialized')
        // logger.debug(`Removing transaction ${tx.id} from redis pool`)
        let x = this.redis.lrem(this.key, 1, serialized)
        if (x < 1) {
          logger.warn(`Removing failed, transaction not found in pool with key:${this.key} tx:${serialized} TX_JSON:${JSON.stringify(tx)}`)
        }
        await this.redis.del(`${this.key}/tx:${tx.id}`)
        await this.redis.del(`${this.key}/tx/expiration:${tx.id}`)
      }
    } catch (error) {
      logger.error('Error removing forged transactions from pool', error.stack)
    }
  }

  async add (object) {
    if (object instanceof this.Class) {
      try {
          logger.debug(`Adding transaction ${object.id} to redis pool`)
          await this.redis.hset(`${this.key}/tx:${object.id}`, 'serialized', object.serialized.toString('hex'), 'timestamp', object.data.timestamp, 'expiration', object.data.expiration)
          await this.redis.rpush(this.key, object.serialized.toString('hex'))
          // logger.warn(JSON.stringify(object.data))
          if (object.data.expiration > 0) {
            logger.debug(`Received transaction ${object.id} with expiration ${object.data.expiration}`)
            await this.redis.hset(`${this.key}/tx/expiration:${object.id}`, 'id', object.id, 'serialized', object.serialized.toString('hex'), 'timestamp', object.data.timestamp, 'expiration', object.data.expiration)
          }
      } catch (error) {
          logger.error('Rpush tx to txpool error:', error.stack)
      }
    }
  }

  getItems (blockSize) {
    try {
        return this.redis.lrange(this.key, 0, blockSize - 1)
    } catch (error) {
      logger.error('Get serialized items from redis list: ', error.stack)
    }
  }

  async cleanPool (currentTimestamp, blockTime) {
    const items = await this.redis.keys(`${this.key}/tx/expiration:*`)
    for (const key of items) {
      const txDetails = await this.redis.hmget(key, 'id', 'serialized', 'timestamp', 'expiration')
      const expiration = parseInt(txDetails[2]) + (parseInt(txDetails[3]) * blockTime)
      if (expiration <= currentTimestamp) {
        logger.debug(`Removing expired transaction ${key}, expirationTime:${expiration} actualTime:${currentTimestamp}`)
        await this.redis.lrem(this.key, 1, txDetails[1])
        await this.redis.del(`${this.key}/tx:${txDetails[0]}`)
        await this.redis.del(`${this.key}/tx/expiration:${txDetails[0]}`)
      }
    }
  }

  static getInstance () {
    return instance
  }
}
