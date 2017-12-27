const TokenBucket = require('./bucket.js')
const TokenTable = require('./table.js')
const responder = require(`${__root}/api/responder`)

class Throttle {
  constructor(config) {
    this.burst = config.burst
    this.rate = config.rate
    this.whitelist = config.whitelist

    this.table = new TokenTable({
      size: 10000
    })
  }

  mount(req, res, next) {
    let address = req.headers['HTTP_CF_CONNECTING_IP'] || req.headers['X-FORWARDED-FOR'] || req.connection.remoteAddress

    let burst = this.burst
    let rate = this.burst

    if (this.whitelist && this.whitelist[address]) {
      burst = this.whitelist[address].burst;
      rate = this.whitelist[address].rate;
    }

    let bucket = this.table.get(address)

    if (!bucket) {
      bucket = new TokenBucket({
        capacity: burst,
        fillRate: rate
      })

      this.table.set(address, bucket)
    }

    res.header('X-RateLimit-Remaining', Math.floor(bucket.tokens));
    res.header('X-RateLimit-Limit', burst);
    res.header('X-RateLimit-Rate', rate);

    if (!bucket.consume(1)) {
      responder.tooManyRequests(res, 'Too Many Attempts.')

      return next(false)
    }

    return next()
  }
}

module.exports = Throttle
