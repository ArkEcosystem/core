const Joi = require('joi')
const { crypto, utils } = require('@arkecosystem/crypto')
const bip39 = require('bip39')
const bip38 = require('bip38')
const database = require('../../../services/database')
const getBip38Keys = require('../../../utils/bip38-keys')

module.exports = {
  name: 'accounts.bip38.create',
  async method (params) {
    try {
      const account = await getBip38Keys(params.userId, params.bip38)

      return {
        publicKey: account.keys.publicKey,
        address: crypto.getAddress(account.keys.publicKey),
        wif: account.wif
      }
    } catch (error) {
      const keys = crypto.getKeys(bip39.generateMnemonic())

      const encryptedWif = bip38.encrypt(Buffer.from(keys.privateKey, 'hex'), true, params.bip38 + params.userId)
      await database.set(utils.sha256(Buffer.from(params.userId)).toString('hex'), encryptedWif)

      return {
        publicKey: keys.publicKey,
        address: crypto.getAddress(keys.publicKey),
        wif: encryptedWif
      }
    }
  },
  schema: {
    bip38: Joi.string().required(),
    userId: Joi.string().hex().required()
  }
}
