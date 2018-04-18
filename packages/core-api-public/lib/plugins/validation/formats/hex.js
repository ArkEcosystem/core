'use strict';

/**
 * [description]
 * @param  {[type]} ajv [description]
 * @return {[type]}     [description]
 */
module.exports = (ajv) => {
  ajv.addFormat('hex', {
    type: 'string',
    validate: (value) => {
      try {
        Buffer.from(value, 'hex')

        return true
      } catch (e) {
        return false
      }
    }
  })
}
