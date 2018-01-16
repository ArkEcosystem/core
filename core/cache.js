const bluebird = require('bluebird')
const redis = require('redis')

let instance

class Cache {
  static getInstance () {
    return instance
  }

  static create () {
    instance = redis.createClient()

    bluebird.promisifyAll(redis.RedisClient.prototype);

    return bluebird.resolve(instance)
  }

  static get (key) {
    return instance.getAsync(key).then((data) => {
      return data ? JSON.parse(data) : false
    });
  }

  static set (key, value, ttl = 3600) {
    instance.setex(key, ttl, JSON.stringify(value))
  }

  static generateKey (value) {
    return Buffer.from(JSON.stringify(value)).toString('base64')
  }

  static flushdb () {
    instance.flushdb(success => {
        console.log(success);
    });
  }
}

module.exports = Cache
