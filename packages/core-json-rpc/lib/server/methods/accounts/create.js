const Joi = require('joi')
const arkjs = require('arkjs')

module.exports = {
  name: 'accounts.create',
  method: async (params) => {
    const account = arkjs.crypto.getKeys(params.passphrase)

    return {
      publicKey: account.publicKey,
      address: arkjs.crypto.getAddress(account.publicKey)
    }
  },
  schema: {
    passphrase: Joi.string().required()
  }
}
