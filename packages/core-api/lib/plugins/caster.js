'use strict'

/* eslint-disable */

const { bignumify } = require('@arkecosystem/core-utils')

/**
 * Check if the given value is a boolean.
 * @param  {*}  value
 * @return {Boolean}
 */
function isBoolean (value) {
  try {
    return (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
  } catch (e) {
    return false
  }
}

/**
 * Check if the given value is a number.
 * @param  {*}  value
 * @return {Boolean}
 */
function isNumber (value) {
  return !isNaN(value)
}

/**
 * @TODO - Review this module later on in the development.
 *
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.ext({
    type: 'onPreHandler',
    method: (request, h) => {
      const query = request.query

      Object.keys(query).map((key, index) => {
        // Special fields that should always be a "string"
        if (key === 'id' || key === 'blockId' || key === 'previousBlock') {
          query[key] = query[key]
        }
        // Booleans
        else if (isBoolean(query[key])) {
          query[key] = query[key].toLowerCase() === 'true'
        }
        // Integers - making sure "BigNumbers" are kept as strings
        else if (isNumber(query[key])) {
          query[key] = (query[key] == Number(query[key]))
            ? Number(query[key])
            : bignumify(query[key]).toString()
        }
        // Strings
        else {
          query[key] = query[key]
        }
      })

      request.query = query

      return h.continue
    }
  })
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'core-caster',
  version: '0.1.0',
  register
}
