const Boom = require('boom')
const Joi = require('joi')
const bip38 = require('bip38')
const { crypto, utils } = require('@arkecosystem/crypto')
const database = require('../../../services/database')
const decryptWIF = require('../../../utils/decrypt-wif')

module.exports = {
  name: 'wallets.bip38.info',
  async method(params) {
    const encryptedWIF = await database.get(
      utils.sha256(Buffer.from(params.userId)).toString('hex'),
    )

    if (!encryptedWIF) {
      return Boom.notFound(`User ${params.userId} could not be found.`)
    }

    const { keys, wif } = decryptWIF(encryptedWIF, params.userId, params.bip38)

    return {
      publicKey: keys.publicKey,
      address: crypto.getAddress(keys.publicKey),
      wif,
    }
  },
  schema: {
    bip38: Joi.string().required(),
    userId: Joi.string()
      .hex()
      .required(),
  },
}
