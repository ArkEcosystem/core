'use strict'

const ip = require('ip')
const AJV = require('ajv')

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  const ajv = new AJV()

  ajv.addFormat('ip', {
    type: 'string',
    validate: (value) => {
      return ip.isV4Format(value) || ip.isV6Format(value)
    }
  })

  server.ext({
    type: 'onRequest',
    async method (request, h) {
      if (!request.path.startsWith('/peer')) {
        return h.continue
      }

      const errors = ajv.validate({
        type: 'object',
        properties: {
          ip: {
            type: 'string',
            format: 'ip'
          },
          port: {
            type: 'integer',
            minimum: 1,
            maximum: 65535
          },
          os: {
            type: 'string',
            maxLength: 64
          },
          nethash: {
            type: 'string',
            maxLength: 64
          },
          version: {
            type: 'string',
            maxLength: 11
          }
        },
        required: ['version', 'nethash', 'port']
      }, request.headers) ? null : ajv.errors

      if (errors) {
        return h.response({
          error: errors[0].message,
          success: false
        }).takeover()
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
  name: 'validate-headers',
  version: '0.1.0',
  register
}
