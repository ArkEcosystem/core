const TokenBucket = require('./bucket.js')
const TokenTable = require('./table.js')
const responder = requireFrom('api/responder')
const requestIp = require('request-ip')

let instance

module.exports = class Throttle {
  constructor (config) {
    if (!instance) {
      instance = this
    }

    instance.burst = config.burst
    instance.rate = config.rate
    instance.whitelist = config.whitelist

    instance.table = new TokenTable({
      size: 10000
    })
  }

  mount (req, res, next) {
    let address = requestIp.getClientIp(req)

    let burst = instance.burst
    let rate = instance.burst

    if (instance.whitelist && instance.whitelist[address]) {
      burst = instance.whitelist[address].burst
      rate = instance.whitelist[address].rate
    }

    let bucket = instance.table.get(address)

    if (!bucket) {
      bucket = new TokenBucket({
        capacity: burst,
        fillRate: rate
      })

      instance.table.set(address, bucket)
    }

    res.header('X-RateLimit-Remaining', Math.floor(bucket.tokens))
    res.header('X-RateLimit-Limit', burst)
    res.header('X-RateLimit-Rate', rate)

    if (!bucket.consume(1)) {
      responder.tooManyRequests(res, 'Too Many Attempts.')

      return next(false)
    }

    return next()
  }
}
