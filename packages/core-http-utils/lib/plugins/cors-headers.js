'use strict'

// Based on https://github.com/gr2m/hapi-cors-headers which was never updated to support hapi.js 17

const register = async (server, options) => {
  server.ext({
    type: 'onPreResponse',
    method: (request, h) => {
      if (!request.headers.origin) {
        return h.continue
      }

      const response = request.response.isBoom ? request.response.output : request.response
      response.headers['access-control-allow-origin'] = request.headers.origin
      response.headers['access-control-allow-credentials'] = 'true'

      if (request.method !== 'options') {
        return h.continue
      }

      response.statusCode = 200
      response.headers['access-control-expose-headers'] = 'content-type, content-length, etag'
      response.headers['access-control-max-age'] = options.maxAge || 60 * 10

      if (request.headers['access-control-request-headers']) {
        response.headers['access-control-allow-headers'] = request.headers['access-control-request-headers']
      }

      if (request.headers['access-control-request-method']) {
        response.headers['access-control-allow-methods'] = request.headers['access-control-request-method']
      }

      return h.continue
    }
  })
}

exports.plugin = {
  name: 'cors-headers',
  version: '0.1.0',
  register
}
