const Joi = require('joi')
const ark = require('@arkecosystem/crypto')

module.exports = {
  name: 'accounts.create',
  async method (params) {
    const account = ark.crypto.getKeys(params.passphrase)

    return {
      publicKey: account.publicKey,
      address: ark.crypto.getAddress(account.publicKey)
    }
  },
  schema: {
    passphrase: Joi.string().required()
  }
}
