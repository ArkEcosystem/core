const Joi = require('joi')
const { crypto } = require('@arkecosystem/crypto')

module.exports = {
  name: 'wallets.create',
  async method (params) {
    const { publicKey } = crypto.getKeys(params.passphrase)

    return {
      publicKey: publicKey,
      address: crypto.getAddress(publicKey)
    }
  },
  schema: {
    passphrase: Joi.string().required()
  }
}
