const Boom = require('boom')

const register = async (server, options) => {
  server.ext({
    type: 'onPreHandler',
    async method(request, h) {
      const contentType = request.headers['content-type']

      if (contentType !== 'application/json') {
        return Boom.unsupportedMediaType()
      }

      return h.continue
    },
  })
}

exports.plugin = {
  name: 'content-type',
  version: '0.1.0',
  register,
}
