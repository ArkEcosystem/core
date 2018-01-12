const bs58check = require('bs58check')
const config = requireFrom('core/config')

class AddressFormat {
  constructor (ajv) {
    ajv.addFormat('address', {
      type: 'string',
      validate: function (value, parentSchema) {
        if (value.length === 0) {
          return true
        }
        try {
          return bs58check.decode(value)[0] == config.network.pubKeyHash
        } catch (e) {
          return false
        }
      }
    });
  }
}

module.exports = AddressFormat
