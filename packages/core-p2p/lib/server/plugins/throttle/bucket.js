const logger = require('@phantomcore/core-container').resolvePlugin('logger')
const { RateLimiter } = require('limiter')

class Bucket {
  /**
   * Create a new bucket instance.
   */
  constructor () {
    this.limiters = {}
    this.limits = {}
  }

  /**
   * Associate a rate limiter with the given IP.
   *
   * @param {String} ip
   * @param {Number} limit
   */
  add (ip, limit) {
    this.limiters[ip] = new RateLimiter(limit, 'minute', true)
    this.limits[ip] = limit
  }

  /**
   * Get the rate limiter that is associated with the given IP.
   *
   * @param  {String} ip
   * @return {RateLimiter}
   */
  get (ip) {
    return this.limiters[ip]
  }

  /**
   * Check if a rate limiter is associated with the given IP.
   *
   * @param  {String}  ip
   * @return {Boolean}
   */
  has (ip) {
    return this.limiters.hasOwnProperty(ip)
  }

  /**
   * Remove the rate limiter associated with the given IP.
   *
   * @param  {String} ip
   * @return {void}
   */
  remove (ip) {
    delete this.limiters[ip]
  }

  /**
   * Decrement the number of tokens by the given amount.
   *
   * @param  {String} ip
   * @param  {Number} amount
   * @return {void}
   */
  decrement (ip, amount = 1) {
    this.get(ip).removeTokens(amount, (err, remaining) => {
      if (err) {
        logger.debug(err.message)
      }

      this.limits[ip] = remaining
    })
  }

  /**
   * Get the remaining number of tokens.
   *
   * @param  {String} ip
   * @return {Number}
   */
  remaining (ip) {
    return this.limits[ip]
  }
}

module.exports = new Bucket()
