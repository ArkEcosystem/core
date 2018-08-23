'use strict'

const logger = require('@phantomcore/core-container').resolvePlugin('logger')
const requestIp = require('request-ip')
const bucket = require('./bucket')
const isWhitelist = require('../../../utils/is-whitelist')

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  const isKnown = value => {
    return server.app.p2p
      .getPeers()
      .find(peer => (peer.ip === value))
  }

  server.ext({
    type: 'onRequest',
    async method (request, h) {
      const remoteAddress = requestIp.getClientIp(request)

      if (isWhitelist(['127.*'], remoteAddress)) {
        return h.continue
      }

      if (!bucket.has(remoteAddress)) {
        bucket.add(remoteAddress, isKnown(remoteAddress) ? 2000 : 1)
      }

      bucket.decrement(remoteAddress)

      if (bucket.remaining(remoteAddress) <= 0) {
        logger.debug(`${remoteAddress} has exceeded the maximum number of requests per minute.`)

        return h.response({
            success: false,
            message: 'You have exceeded the maximum number of requests per minute.'
        }).code(500).takeover()
      }

      return h.continue
    }
  })
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'core-p2p-throttle',
  version: '0.1.0',
  register
}
