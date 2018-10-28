const Joi = require('joi')
const { crypto, utils } = require('@arkecosystem/crypto')
const bip39 = require('bip39')
const bip38 = require('bip38')
const database = require('../../../services/database')
const getBIP38Wallet = require('../../../utils/bip38-keys')

module.exports = {
  name: 'wallets.bip38.create',
  async method (params) {
    try {
      const { keys, wif } = await getBIP38Wallet(params.userId, params.bip38)

      return {
        publicKey: keys.publicKey,
        address: crypto.getAddress(keys.publicKey),
        wif: wif
      }
    } catch (error) {
      const { publicKey, privateKey } = crypto.getKeys(bip39.generateMnemonic())

      const encryptedWif = bip38.encrypt(Buffer.from(privateKey, 'hex'), true, params.bip38 + params.userId)
      await database.set(utils.sha256(Buffer.from(params.userId)).toString('hex'), encryptedWif)

      return {
        publicKey: publicKey,
        address: crypto.getAddress(publicKey),
        wif: encryptedWif
      }
    }
  },
  schema: {
    bip38: Joi.string().required(),
    userId: Joi.string().hex().required()
  }
}
