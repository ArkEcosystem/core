const Redis = require('ioredis')
const redis = new Redis()

let instance = null
// TODO here check also
// - exipration date of transactions
// - spamming
// - max size, etc...
module.exports = class MemoryPool {
  constructor (Class, config) {
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
    this.key = 'ark:tx_pool'
  }

  get size () {
    return Object.keys(this.pool).length
  }

  removeForgedTransactions (forgedIds) {
    forgedIds.forEach(id => {
      this.delete(id)
    })
  }

  async add (object) {
    if (object instanceof this.Class) {
      this.pool[object.id] = object.serialized.toString('hex')
      try {
          const result = await redis.rpush(this.key, object.serialized.toString('hex'))
          // console.log(result)
      } catch (error) {
          console.error(error)
      }
    }
  }

  async getItems (blockSize) {
      try {
          return redis.lrange(this.key, 0, blockSize - 1)
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
