const Promise = require('bluebird')
const redis = require('redis')
const logger = require('../logger')

let instance

module.exports = class Cache {
  constructor (config) {
    Promise.promisifyAll(redis.RedisClient.prototype)

    if (!instance) {
      logger.debug('Cache has been instantiated.')

      instance = this
    } else {
      logger.debug('Cache already instantiated.')
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

  async get (key) {
    const data = await this.client.getAsync(`${this.connection}_${key}`)

    return data ? JSON.parse(data) : false
  }

  async set (key, value) {
    return this.client.set(`${this.connection}_${key}`, JSON.stringify(value))
  }

  async has (key) {
    const data = await this.client.getAsync(`${this.connection}_${key}`)

    return !!data
  }

  async del (key) {
    return this.client.del(`${this.connection}_${key}`)
  }

  async flush () {
    return this.client.flushdb()
  }

  generateKey (value) {
    return Buffer.from(JSON.stringify(value)).toString('base64')
  }
}
