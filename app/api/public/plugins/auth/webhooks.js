const Boom = require('boom')
const argon2 = require('argon2')

const implementation = (server, options) => {
  const scheme = {
    authenticate: async (request, h) => {
      const authorization = request.headers.authorization

      if (!authorization) {
        throw Boom.unauthorized(null)
      }

      // TODO: do we hash the password via ark-commander and argon2?
      // await argon2.verify(options.password, authorization)
      if (options.password === authorization) {
        return h.continue
      }

      throw Boom.unauthorized()
    }
  }

  return scheme
}

const register = async (server, options) => {
  server.auth.scheme('webhooks', implementation)
}

exports.plugin = {
  name: 'hapi-webhook-auth',
  version: '1.0.0',
  register
}
