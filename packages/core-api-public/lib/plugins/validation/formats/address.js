'use strict'

const bs58check = require('bs58check')
const config = require('@arkecosystem/core-plugin-manager').get('config')

/**
 * Register the "address" validation rule.
 * @param  {AJV} ajv
 * @return {void}
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
