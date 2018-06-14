'use strict'

const PLUGIN_NAME = 'hapi-ajv'

const fs = require('fs')
const path = require('path')
const Boom = require('boom')
const AJV = require('ajv')

const ajv = new AJV()

/**
 * Validate the given data using AJV.
 * @param  {Object} schema
 * @param  {Object} data
 * @return {(Boolean|Object)}
 */
function validate (schema, data) {
  return ajv.validate(schema, data) ? null : ajv.errors
}

/**
 * Create an error response for hapi.js.
 * @param  {Hapi.Request} request
 * @param  {Hapi.Toolkit} h
 * @param  {Array} errors
 * @return {Hapi.Response}
 */
function createErrorResponse (request, h, errors) {
  return request.pre.apiVersion === 1
    ? h.response({ path: errors[0].dataPath, error: errors[0].message, success: false }).takeover()
    : Boom.badData(errors)
}

/**
 * The register method uses by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.ext({
    type: 'onPreHandler',
    method: (request, h) => {
      const config = request.route.settings.plugins[PLUGIN_NAME] || {}

      let errors

      if (config.payloadSchema) {
        errors = validate(config.payloadSchema, request.payload)

        if (errors) {
          return createErrorResponse(request, h, errors)
        }
      }

      if (config.querySchema) {
        errors = validate(config.querySchema, request.query)

        if (errors) {
          return createErrorResponse(request, h, errors)
        }
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
  name: PLUGIN_NAME,
  version: '0.1.0',
  register
}
