const app = require('@arkecosystem/core-container')

const config = app.resolvePlugin('config')

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  const headers = {
    nethash: config.network.nethash,
    version: app.getVersion(),
    port: app.resolveOptions('p2p').port,
    os: require('os').platform(),
    height: null,
  }

  const requiredHeaders = ['nethash', 'version', 'port', 'os', 'height']

  if (config.network.name !== 'mainnet') {
    headers.hashid = app.getHashid()
    requiredHeaders.push('hashid')
  }

  server.ext({
    type: 'onPreResponse',
    async method(request, h) {
      const blockchain = app.resolvePlugin('blockchain')
      if (blockchain) {
        const lastBlock = blockchain.getLastBlock()
        if (lastBlock) {
          headers.height = lastBlock.data.height
        }
      }

      const response = request.response
      if (response.isBoom) {
        if (response.data) {
          // Deleting the property beforehand makes it appear last in the
          // response body.
          delete response.output.payload.error
          response.output.payload.error = response.data
        }

        requiredHeaders.forEach(key => {
          response.output.headers[key] = headers[key]
        })
      } else {
        requiredHeaders.forEach(key => response.header(key, headers[key]))
      }

      return h.continue
    },
  })
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'set-headers',
  version: '0.1.0',
  register,
}
