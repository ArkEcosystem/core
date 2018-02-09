const Boom = require('boom')

const implementation = (server, options) => {
  const scheme = {
    authenticate: async (request, h) => {
      const authorization = request.headers.authorization

      if (!authorization) {
        throw Boom.unauthorized(null)
      }

      if (authorization !== options.secret) {
        throw Boom.unauthorized()
      }

      return h.continue
    }
  }

  return scheme
}

const register = async (server, options) => {
  server.auth.scheme('subscription', implementation)
}

exports.plugin = {
  name: 'hapi-subscription-auth',
  version: '1.0.0',
  register
}
