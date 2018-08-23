const Joi = require('joi')
const phantom = require('@phantomcore/crypto')

module.exports = {
  name: 'accounts.create',
  async method (params) {
    const account = phantom.crypto.getKeys(params.passphrase)

    return {
      publicKey: account.publicKey,
      address: phantom.crypto.getAddress(account.publicKey)
    }
  },
  schema: {
    passphrase: Joi.string().required()
  }
}
