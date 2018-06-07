const Redis = require('ioredis')

/**
 * This is a simple implementation of a cache, currently using Redis only.
 * More things to add: flushing, expiration, etc.
 */
module.exports = class Cache {
  constructor () {
    this.redis = new Redis()
  }

  async get (key) {
    this.redis.get(key)
  }

  async set (key, value) {
    this.redis.set(key, value)
  }
}
