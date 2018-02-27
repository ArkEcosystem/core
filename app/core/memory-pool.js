const Redis = require('ioredis')
const redis = new Redis()

const key = 'ark:tx_pool'

let instance = null
// TODO here check also
// - exipration date of transactions
// - spamming
// - max size, etc...
module.exports = class MemoryPool {
  constructor (Class) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 MemoryPools!')

    if (Class === undefined) {
      throw new Error('No arguments');
    }

    if (typeof Class !== 'function') {
      throw new Error(`${Class} is not a function`)
    }

    this.Class = Class
    this.pool = {}
  }

  async size () {
    return redis.llen(key)
  }

  async removeForgedTransactions (serializedTransactions) {
    await serializedTransactions.forEach(tx => {
      redis.lrem(key, 1, tx)
    })
  }

  async add (object) {
    if (object instanceof this.Class) {
      this.pool[object.id] = object.serialized.toString('hex')
      try {
          await redis.rpush(key, object.serialized.toString('hex'))
      } catch (error) {
          console.error(error)
      }
    }
  }

  getItems (blockSize) {
    try {
        return redis.lrange(key, 0, blockSize - 1)
    } catch (error) {
        console.error(error)
    }
  }

  delete (transaction) {
    // return this.client.lrem(this.key, transaction)
  }

  clear () {
    this.pool = {}
  }

  static getInstance () {
    return instance
  }
}
