const { configManager, crypto, utils } = require('@arkecosystem/crypto')
const bip38 = require('bip38')
const wif = require('wif')
const database = require('../services/database')

module.exports = async (userId, bip38password) => {
  try {
    const encryptedWif = await database.get(utils.sha256(Buffer.from(userId)).toString('hex'))

    if (encryptedWif) {
      const decrypted = bip38.decrypt(encryptedWif.toString('hex'), bip38password + userId)
      const wifKey = wif.encode(configManager.get('wif'), decrypted.privateKey, decrypted.compressed)
      const keys = crypto.getKeysFromWIF(wifKey)

      return { keys, wif: wifKey }
    }
  } catch (error) {
    throw Error('Could not find a matching WIF')
  }
}
