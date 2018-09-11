const Redis = require('ioredis')

module.exports = class Cache {
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
