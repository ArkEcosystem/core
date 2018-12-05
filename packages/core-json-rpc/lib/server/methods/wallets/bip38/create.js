const Joi = require('joi')
const { configManager, crypto, utils } = require('@arkecosystem/crypto')
const bip39 = require('bip39')
const bip38 = require('bip38')
const wif = require('wif')
const database = require('../../../services/database')
const getBIP38Wallet = require('../../../utils/bip38-keys')

module.exports = {
  name: 'wallets.bip38.create',
  async method(params) {
    try {
      const { keys, wifKey } = await getBIP38Wallet(params.userId, params.bip38)

      return {
        publicKey: keys.publicKey,
        address: crypto.getAddress(keys.publicKey),
        wif: wifKey,
      }
    } catch (error) {
      const { publicKey, privateKey } = crypto.getKeys(bip39.generateMnemonic())

      const encryptedWif = bip38.encrypt(
        Buffer.from(privateKey, 'hex'),
        true,
        params.bip38 + params.userId,
      )
      await database.set(
        utils.sha256(Buffer.from(params.userId)).toString('hex'),
        encryptedWif,
      )

      const wifKey = wif.encode(configManager.get('wif'), privateKey, true)

      return {
        publicKey,
        address: crypto.getAddress(publicKey),
        wif: wifKey,
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
