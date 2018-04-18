'use strict';

const config = require('@arkecosystem/core-pluggy').get('config')

const register = async (server, options) => {
  const _headers = {
    nethash: config.network.nethash,
    version: config.server.version,
    port: config.server.port,
    os: require('os').platform()
  }

  const requiredHeaders = ['nethash', 'version', 'port', 'os']

  server.ext({
    type: 'onPreResponse',
    method: async (request, h) => {
      if (request.response.isBoom) {
        requiredHeaders.forEach((key) => (request.response.output.headers[key] = _headers[key]))
      } else {
        requiredHeaders.forEach((key) => request.response.header(key, _headers[key]))
      }

      return h.continue
    }
  })
}

exports.plugin = {
  name: 'hapi-p2p-set-headers',
  version: '1.0.0',
  register
}
