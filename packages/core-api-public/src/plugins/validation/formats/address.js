'use strict';

const bs58check = require('bs58check')
const config = require('@arkecosystem/core-plugin-manager').get('config')

/**
 * [description]
 * @param  {[type]} ajv [description]
 * @return {[type]}     [description]
 */
module.exports = (ajv) => {
  ajv.addFormat('address', {
    type: 'string',
    validate: function (value, parentSchema) {
      try {
        return bs58check.decode(value)[0] === config.network.pubKeyHash
      } catch (e) {
        return false
      }
    }
  })
}
