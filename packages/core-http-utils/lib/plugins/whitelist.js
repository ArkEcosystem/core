'use strict'

const Boom = require('boom')
const requestIp = require('request-ip')
const mm = require('micromatch')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

const register = async (server, options) => {
  server.ext({
    type: 'onRequest',
    async method (request, h) {
      const remoteAddress = requestIp.getClientIp(request)

      if (Array.isArray(options.whitelist)) {
        for (const ip of options.whitelist) {
          if (mm.isMatch(remoteAddress, ip)) {
            return h.continue
          }
        }
      }

      logger.warn(`${remoteAddress} tried to access the ${options.name} without being whitelisted :warning:`)

      return Boom.forbidden()
    }
  })
}

exports.plugin = {
  name: 'whitelist',
  version: '0.1.0',
  register
}
