const configManager = require('../managers/config')
const Address = require('./address')
const Keys = require('./keys')

module.exports = class PublicKey {
  static fromPassphrase (passphrase) {
    return Keys.fromPassphrase(passphrase).publicKey
  }

  // static fromHex (publicKey) {}

  static fromWIF (wif, network) {
    return Keys.fromWIF(wif, network).publicKey
  }

  static validate (publicKey, networkVersion) {
    if (!networkVersion) {
      networkVersion = configManager.get('pubKeyHash')
    }

    try {
      return Address.fromPublicKey(publicKey, networkVersion).length === 34
    } catch (e) {
      return false
    }
  }
}
