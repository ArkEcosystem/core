const { configManager, crypto } = require('@arkecosystem/crypto')
const bip38 = require('bip38')
const wif = require('wif')

module.exports = (encryptedWif, userId, bip38password) => {
  const decrypted = bip38.decrypt(
    encryptedWif.toString('hex'),
    bip38password + userId,
  )

  const encodedWIF = wif.encode(
    configManager.get('wif'),
    decrypted.privateKey,
    decrypted.compressed,
  )

  return { keys: crypto.getKeysFromWIF(encodedWIF), wif: encodedWIF }
}
