const Joi = require('joi')
const { crypto, utils } = require('@arkecosystem/crypto')
const bip39 = require('bip39')
const bip38 = require('bip38')
const database = require('../../../services/database')
const getBIP38Wallet = require('../../../utils/bip38-keys')
const decryptWIF = require('../../../utils/decrypt-wif')

module.exports = {
  name: 'wallets.bip38.create',
  async method(params) {
    try {
      const { keys, wif } = await getBIP38Wallet(params.userId, params.bip38)

      return {
        publicKey: keys.publicKey,
        address: crypto.getAddress(keys.publicKey),
        wif,
      }
    } catch (error) {
      const { publicKey, privateKey } = crypto.getKeys(bip39.generateMnemonic())

      const encryptedWIF = bip38.encrypt(
        Buffer.from(privateKey, 'hex'),
        true,
        params.bip38 + params.userId,
      )
      await database.set(
        utils.sha256(Buffer.from(params.userId)).toString('hex'),
        encryptedWIF,
      )

      const { wif } = decryptWIF(encryptedWIF, params.userId, params.bip38)

      return {
        publicKey,
        address: crypto.getAddress(publicKey),
        wif,
      }
    }
  },
  schema: {
    bip38: Joi.string().required(),
    userId: Joi.string()
      .hex()
      .required(),
  },
}
