const config = require('app/core/config')

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
      const response = request.response

      if (request.response.isBoom) {
        response.output.headers['x'] = 'value';
        requiredHeaders.forEach((key) => (response.output.headers[key] = _headers[key]))
      } else {
        requiredHeaders.forEach((key) => response.header(key, _headers[key]))
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
