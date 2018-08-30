'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  const headers = {
    nethash: config.network.nethash,
    version: container.resolveOptions('blockchain').version,
    port: container.resolveOptions('p2p').port,
    os: require('os').platform()
  }

  const requiredHeaders = ['nethash', 'version', 'port', 'os']

  server.ext({
    type: 'onPreResponse',
    async method (request, h) {
      if (request.response.isBoom) {
        requiredHeaders.forEach((key) => (request.response.output.headers[key] = headers[key]))
      } else {
        requiredHeaders.forEach((key) => request.response.header(key, headers[key]))
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
  name: 'set-headers',
  version: '0.1.0',
  register
}
