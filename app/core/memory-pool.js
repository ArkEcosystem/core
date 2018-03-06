const Redis = require('ioredis')
const Transaction = require('app/models/transaction')
const logger = require('app/core/logger')

let instance = null
// TODO here check also
// - exipration date of transactions
// - max size, etc...
module.exports = class MemoryPool {
  constructor (Class, config, log = false) {
    if (!instance) {
      instance = this
    } else {
      throw new Error('Cannot initialize two instances of memory pool...');
    }
    this.redis = config.server.txpool ? new Redis(config.server.txpool.port, config.server.txpool.host) : new Redis()
    this.key = config.server.txpool ? config.server.txpool.key : 'ark:tx_pool'
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

  async removeForgedTransactions (serializedTransactions) {
    try {
      await serializedTransactions.forEach(tx => {
        this.redis.lrem(this.key, 1, Transaction.serialize(tx).toString('hex'))
      })
    } catch (error) {
      logger.error('Error removing forged transactions from pool', error.stack)
    }
  }

  async add (object) {
    if (object instanceof this.Class) {
      try {
          await this.redis.rpush(this.key, object.serialized.toString('hex'))
      } catch (error) {
          logger.error('Rpush tx to txpool error:', error.stack)
      }
    }
  }

  getItems (blockSize) {
    try {
        return this.redis.lrange(this.key, 0, blockSize - 1)
    } catch (error) {
      logger.error('Get Items from this.redis: ', error.stack)
    }
  }

  async cleanPool (blockHeight, blockTimeStamp) {
    const items = await this.redis.lrange(this.key, 0, -1)
    // const items = await this.redis.lrange(this.key, 0, 4)
    logger.debug('start cleanin')
    items.forEach(tx => {
      let trans = Transaction.fromBytes(tx)
      // TODO check expiration and remove from pool if needed
      if (trans.expiration > 0) {
        // remove
      }
    })
    logger.debug('stop cleaning')
  }

  static getInstance () {
    return instance
  }
}
