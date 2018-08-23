'use strict'

const mm = require('micromatch')
const logger = require('@phantomcore/core-container').resolvePlugin('logger')

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  const defaultRemoteAddresses = ['::1', '127.0.0.1', '::ffff:127.0.0.1']

  server.ext({
    type: 'onRequest',
    async method (request, h) {
      let remoteAddress = request.info.remoteAddress

      if (remoteAddress.startsWith('::ffff:')) {
        remoteAddress = remoteAddress.replace('::ffff:', '')
      }

      if (options.allowRemote) {
        return h.continue
      }

      if (request.path.includes('broadcast')) {
        return h.continue
      }

      if (options.whitelist) {
        const whitelist = defaultRemoteAddresses.concat(options.whitelist)

        for (let i = 0; i < whitelist.length; i++) {
          if (mm.isMatch(remoteAddress, whitelist[i])) {
            return h.continue
          }
        }
      }

      logger.warn(`${remoteAddress} tried to access the JSON-RPC without being whitelisted :warning:`)

      return h.response().code(403).takeover()
    }
  })
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'json-rpc-whitelist',
  version: '0.1.0',
  register
}
