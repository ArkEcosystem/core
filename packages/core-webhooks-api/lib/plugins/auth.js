'use strict'

const Boom = require('boom')
const argon2 = require('argon2')

/**
 * The concrete implementation of the authentication.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {Object}
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

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.auth.scheme('webhooks', implementation)
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'hapi-webhook-auth',
  version: '1.0.0',
  register
}
