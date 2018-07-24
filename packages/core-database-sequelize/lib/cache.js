const Redis = require('ioredis')

/**
 * This is a simple implementation of a cache, currently using Redis only.
 * More things to add: flushing, expiration, etc.
 */
module.exports = class Cache {
  /**
   * Instantiates new Redis object and connects automatically
   */
  constructor (options) {
    this.mount(options)
  }

  getRedisOptions () {
    return this.redis.options
  }

  async get (key) {
    this.redis.get(key)
  }

  async set (key, value) {
    this.redis.set(key, value)
  }

  mount (options) {
    this.redis = new Redis(options)
  }

  destroy () {
    this.redis.disconnect()
  }
}
