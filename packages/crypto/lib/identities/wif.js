const wif = require('wif')
const configManager = require('../managers/config')
const Keys = require('./keys')

module.exports = class WIF {
  static fromPassphrase (passphrase, network) {
    const keys = Keys.fromPassphrase(passphrase)

    if (!network) {
      network = configManager.all()
    }

    return wif.encode(network.wif, Buffer.from(keys.privateKey, 'hex'), keys.compressed)
  }
}
