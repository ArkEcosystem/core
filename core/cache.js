const Promise = require('bluebird')
const redis = require('redis')
const logger = require('./logger')

let instance

module.exports = class Cache {
  constructor (config) {
    Promise.promisifyAll(redis.RedisClient.prototype)

    if (!instance) {
      logger.debug('Cache has been instantiated.');

      instance = this
    } else {
      logger.debug('Cache already instantiated.');
    }

    this.client = redis.createClient(Object.keys(config).forEach((key) => (config[key] == null) && delete config[key]))

    return instance
  }

  static getInstance (connection) {
    instance.connection = connection || 'ark'

    return instance
  }

  isConnected () {
    return this.client.ready
  }

  get (key) {
    return this.client.getAsync(`${this.connection}_${key}`).then((data) => data ? JSON.parse(data) : false)
  }

  set (key, value) {
    return Promise.resolve(this.client.set(`${this.connection}_${key}`, JSON.stringify(value)))
  }

  del (key) {
    return Promise.resolve(this.client.del(`${this.connection}_${key}`))
  }

  flush () {
    return Promise.resolve(this.client.flushdb())
  }

  generateKey (value) {
    return Buffer.from(JSON.stringify(value)).toString('base64')
  }
}
