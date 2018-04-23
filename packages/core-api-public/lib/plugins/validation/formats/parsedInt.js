'use strict';

/**
 * [description]
 * @param  {[type]} ajv [description]
 * @return {[type]}     [description]
 */
module.exports = (ajv) => {
  ajv.addFormat('parsedInt', {
    type: 'string',
    validate: (value) => {
      if (isNaN(value) || parseInt(value) !== value || isNaN(parseInt(value, 10))) {
        return false
      }

      value = parseInt(value)

      return true
    }
  })
}
