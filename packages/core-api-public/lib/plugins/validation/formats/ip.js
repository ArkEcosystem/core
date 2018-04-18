'use strict';

const ip = require('ip')

/**
 * [description]
 * @param  {[type]} ajv [description]
 * @return {[type]}     [description]
 */
module.exports = (ajv) => {
  ajv.addFormat('ip', {
    type: 'string',
    validate: (value) => {
      return ip.isV4Format(value) || ip.isV6Format(value)
    }
  })
}
