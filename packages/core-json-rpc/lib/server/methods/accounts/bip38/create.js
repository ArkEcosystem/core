const Joi = require('joi')
const phantom = require('@phantomcore/crypto')
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
        publicKey: account.keys.getPublicKeyBuffer().toString('hex'),
        address: account.keys.getAddress(),
        wif: account.wif
      }
    } catch (error) {
      const keys = phantom.crypto.getKeys(bip39.generateMnemonic())

      const encryptedWif = bip38.encrypt(keys.d.toBuffer(32), true, params.bip38 + params.userId)
      database.setUTF8(phantom.utils.sha256(Buffer.from(params.userId)).toString('hex'), encryptedWif)

      return {
        publicKey: keys.getPublicKeyBuffer().toString('hex'),
        address: keys.getAddress(),
        wif: encryptedWif
      }
    }
  },
  schema: {
    bip38: Joi.string().required(),
    userId: Joi.string().hex().required()
  }
}
