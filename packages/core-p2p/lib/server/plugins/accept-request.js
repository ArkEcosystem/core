'use strict'

const Boom = require('boom')
const requestIp = require('request-ip')
const isWhitelist = require('../../utils/is-whitelist')
const monitor = require('../../monitor')

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  const requiredHeaders = ['nethash', 'version', 'port', 'os']

  server.ext({
    type: 'onRequest',
    async method (request, h) {
      const remoteAddress = requestIp.getClientIp(request)

      if (request.path.startsWith('/config')) {
        return h.continue
      }

      if (!monitor.guard) {
        return Boom.serverUnavailable('Peer Monitor not ready')
      }

      if ((request.path.startsWith('/internal') || request.path.startsWith('/remote')) && !isWhitelist(options.whitelist, remoteAddress)) {
        return h.response({
          code: 'ResourceNotFound',
          message: `${request.path} does not exist`
        }).code(400).takeover()
      }

      if (request.path.startsWith('/peer')) {
        const peer = { ip: remoteAddress }

        requiredHeaders.forEach(key => (peer[key] = request.headers[key]))

        try {
          await monitor.acceptNewPeer(peer)
        } catch (error) {
          return Boom.badImplementation(error.message)
        }
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
  name: 'accept-request',
  version: '0.1.0',
  register
}
