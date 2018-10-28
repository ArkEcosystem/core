const secp256k1 = require('secp256k1')
const wif = require('wif')

const configManager = require('../managers/config')
const utils = require('../crypto/utils')

module.exports = class Keys {
  static fromPassphrase (passphrase, compressed = true) {
    const privateKey = utils.sha256(Buffer.from(passphrase, 'utf8'))
    return Keys.fromPrivateKey(privateKey, compressed)
  }

  static fromPrivateKey (privateKey, compressed = true) {
    privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, 'hex')

    const publicKey = secp256k1.publicKeyCreate(privateKey, compressed)
    const keyPair = {
      publicKey: publicKey.toString('hex'),
      privateKey: privateKey.toString('hex'),
      compressed
    }

    return keyPair
  }

  static fromWIF (wifKey, network) {
    const decoded = wif.decode(wifKey)
    const version = decoded.version

    if (!network) {
      network = configManager.all()
    }

    if (version !== network.wif) {
      throw new Error('Invalid network version')
    }

    const privateKey = decoded.privateKey
    const publicKey = secp256k1.publicKeyCreate(privateKey, decoded.compressed)

    const keyPair = {
      publicKey: publicKey.toString('hex'),
      privateKey: privateKey.toString('hex'),
      compressed: decoded.compressed
    }

    return keyPair
  }
}
