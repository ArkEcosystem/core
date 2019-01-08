const { configManager, crypto, utils } = require('@arkecosystem/crypto')
const bip38 = require('bip38')
const wif = require('wif')
const database = require('../services/database')
const decryptWIF = require('./decrypt-wif')

module.exports = async (userId, bip38password) => {
  try {
    const encryptedWif = await database.get(
      utils.sha256(Buffer.from(userId)).toString('hex'),
    )

    if (encryptedWif) {
      return decryptWIF(encryptedWif, userId, bip38password)
    }
  } catch (error) {
    throw Error('Could not find a matching WIF')
  }
}
