/* eslint-disable */

const BigNumber = require('bignumber.js')

function isBoolean (value) {
  try {
    return (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
  } catch (e) {
    return false
  }
}

function isNumber (value) {
  return !isNaN(value)
}

/**
 * @TODO - Revise this module later on in the development.
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
            : BigNumber(query[key]).toString()
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

exports.plugin = {
  name: 'hapi-caster',
  version: '1.0.0',
  register
}
