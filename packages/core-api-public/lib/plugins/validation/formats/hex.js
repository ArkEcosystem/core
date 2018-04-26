'use strict';

/**
 * [description]
 * @param  {AJV} ajv
 * @return {void}
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
