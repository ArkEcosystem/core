const Promise = require('bluebird')
const redis = require('redis')
const logger = require('./logger')

let instance

class Cache {
  constructor (config) {
    this.enabled = config.enabled

    if (!config.enabled) {
      return Promise.resolve(false)
    }

    if (!instance) {
      instance = redis.createClient(Object.keys(config).forEach((key) => (config[key] == null) && delete config[key]))
    }

    instance.on('ready', function () {
      logger.debug('[Cache] Connected with redis')
    })

    instance.on('error', function (err) {
      logger.error(`[Cache] ${err}`)
    })

    Promise.promisifyAll(redis.RedisClient.prototype)

    return Promise.resolve(instance)
  }

  static connected () {
    return this.enabled && instance.ready
  }

  static get (key) {
    logger.debug(`[Cache] Get value for ${key}`)

    return instance.getAsync(key).then((data) => {
      return data ? JSON.parse(data) : false
    })
  }

  static set (key, value) {
    logger.debug(`[Cache] Set value for ${key}`)

    return instance.set(key, JSON.stringify(value))
  }

  static del (key) {
    logger.debug(`[Cache] Delete value for ${key}`)

    return instance.del(key)
  }

  static generateKey (value) {
    logger.debug('[Cache] Generate Key')

    return Buffer.from(JSON.stringify(value)).toString('base64')
  }

  static flush () {
    logger.debug('[Cache] Flush Database')

    return instance.flushdb()
  }
}

module.exports = Cache
