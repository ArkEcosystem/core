const Keys = require('./keys')

module.exports = class PrivateKey {
  static fromPassphrase (passphrase) {
    return Keys.fromPassphrase(passphrase).privateKey
  }

  // static fromHex (privateKey) {}

  static fromWIF (wif, network) {
    return Keys.fromWIF(wif, network).privateKey
  }
}
