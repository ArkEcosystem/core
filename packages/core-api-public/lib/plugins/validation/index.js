'use strict';

const PLUGIN_NAME = 'hapi-ajv'

const fs = require('fs')
const path = require('path')
const Boom = require('boom')
const AJV = require('ajv')

const ajv = new AJV()

/**
 * [validate description]
 * @param  {[type]} schema [description]
 * @param  {[type]} data   [description]
 * @return {[type]}        [description]
 */
function validate (schema, data) {
  return ajv.validate(schema, data) ? null : ajv.errors
}

/**
 * [createErrorResponse description]
 * @param  {[type]} request [description]
 * @param  {[type]} h       [description]
 * @param  {[type]} errors  [description]
 * @return {[type]}         [description]
 */
function createErrorResponse (request, h, errors) {
  return request.pre.apiVersion === 1
    ? h.response({ path: errors[0].dataPath, error: errors[0].message, success: false }).takeover()
    : Boom.badData(errors)
}

/**
 * [registerCustomFormats description]
 * @return {[type]} [description]
 */
function registerCustomFormats () {
  let directory = path.resolve(__dirname, 'formats')

  fs.readdirSync(directory).forEach(file => {
    if (file.indexOf('.js') !== -1) {
      require(directory + '/' + file)(ajv)
    }
  })
}

/**
 * [description]
 * @param  {[type]} server  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
const register = async (server, options) => {
  registerCustomFormats()

  server.ext({
    type: 'onPreHandler',
    method: (request, h) => {
      const config = request.route.settings.plugins[PLUGIN_NAME] || {}

      let errors = null

      if (config.payloadSchema) {
        errors = validate(config.payloadSchema, request.payload)
        if (errors) return createErrorResponse(request, h, errors)
      }

      if (config.querySchema) {
        errors = validate(config.querySchema, request.query)
        if (errors) return createErrorResponse(request, h, errors)
      }

      return h.continue
    }
  })
}

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  name: PLUGIN_NAME,
  version: '1.0.0',
  register
}
