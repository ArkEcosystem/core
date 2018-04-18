'use strict';

/**
 * [description]
 * @param  {[type]} ajv [description]
 * @return {[type]}     [description]
 */
module.exports = (ajv) => {
  ajv.addFormat('publicKey', {
    type: 'string',
    validate: (value) => {
      try {
        return Buffer.from(value, 'hex').length === 33
      } catch (e) {
        return false
      }
    }
  })
}
