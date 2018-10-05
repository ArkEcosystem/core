'use strict'

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.ext({
    type: 'onPreResponse',
    async method (request, h) {
      const response = request.response
      if (response.isBoom && response.data) {
        // Deleting the property beforehand makes it appear last in the
        // response body.
        delete response.output.payload.error
        response.output.payload.error = response.data
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
