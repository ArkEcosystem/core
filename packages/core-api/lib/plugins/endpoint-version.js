'use strict'

const Boom = require('boom')
const versionRegex = /^\/api\/v([0-9])\//

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
      const match = versionRegex.exec(request.path)
      if (match && match.length === 2) {
        const apiVersion = parseInt(match[1])
        if (options.validVersions.includes(apiVersion)) {
          request.pre.apiVersion = apiVersion
        } else {
          return Boom.badRequest('Invalid api-version! Valid values: ' + options.validVersions.join());
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
module.exports = {
  name: 'endpoint-version',
  version: '0.1.0',
  register
}
