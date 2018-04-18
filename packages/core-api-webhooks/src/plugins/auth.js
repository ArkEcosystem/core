'use strict';

const Boom = require('boom')
const argon2 = require('argon2')

/**
 * [description]
 * @param  {[type]} server  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
const implementation = (server, options) => {
  const scheme = {
    authenticate: async (request, h) => {
      const authorization = request.headers.authorization

      if (!authorization) {
        throw Boom.unauthorized(null)
      }

      if (await argon2.verify(options.token, authorization)) {
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

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  name: 'hapi-webhook-auth',
  version: '1.0.0',
  register
}
