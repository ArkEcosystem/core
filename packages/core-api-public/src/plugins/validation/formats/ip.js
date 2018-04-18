'use strict';

const ip = require('ip')

module.exports = (ajv) => {
  ajv.addFormat('ip', {
    type: 'string',
    validate: (value) => {
      return ip.isV4Format(value) || ip.isV6Format(value)
    }
  })
}
