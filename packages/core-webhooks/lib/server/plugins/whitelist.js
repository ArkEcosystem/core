'use strict'

const Boom = require('boom')
const requestIp = require('request-ip')
const mm = require('micromatch')
const container = require('@arkecosystem/core-container')

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.ext({
    type: 'onRequest',
    async method (request, h) {
      const address = requestIp.getClientIp(request)

      for (let i = 0; i < options.whitelist.length; i++) {
        if (mm.isMatch(address, options.whitelist[i])) {
          return h.continue
        }
      }

      container
        .resolvePlugin('logger')
        .warn(`${address} tried to access the Webhooks API without being whitelisted`)

      return Boom.forbidden()
    }
  })
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'core-webhooks-whitelist',
  version: '0.1.0',
  register
}
