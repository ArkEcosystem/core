const bs58check = require('bs58check')
const config = require('@arkecosystem/core-container').resolvePlugin('config')

/**
 * Register the "address" validation rule.
 * @param  {AJV} ajv
 * @return {void}
 */
module.exports = ajv => {
  ajv.addFormat('address', {
    type: 'string',
    validate: value => {
      try {
        return bs58check.decode(value)[0] === config.network.pubKeyHash
      } catch (e) {
        return false
      }
    },
  })
}
