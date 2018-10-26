const bs58check = require('bs58check')
const configManager = require('../managers/config')
const utils = require('../crypto/utils')
const PublicKey = require('./public-key')

module.exports = class Address {
  static fromPassphrase (passphrase, networkVersion) {
    return Address.fromPublicKey(PublicKey.fromPassphrase(passphrase), networkVersion)
  }

  static fromPublicKey (publicKey, networkVersion) {
    const pubKeyRegex = /^[0-9A-Fa-f]{66}$/;
    if (!pubKeyRegex.test(publicKey)) {
      throw new Error(`publicKey '${publicKey}' is invalid`)
    }

    if (!networkVersion) {
      networkVersion = configManager.get('pubKeyHash')
    }

    const buffer = utils.ripemd160(Buffer.from(publicKey, 'hex'))
    const payload = Buffer.alloc(21)

    payload.writeUInt8(networkVersion, 0)
    buffer.copy(payload, 1)

    return bs58check.encode(payload)
  }

  static fromPrivateKey (privateKey, networkVersion) {
    return Address.fromPublicKey(privateKey.publicKey, networkVersion)
  }

  static validate (address, networkVersion) {
    if (!networkVersion) {
      networkVersion = configManager.get('pubKeyHash')
    }

    try {
      const decode = bs58check.decode(address)
      return decode[0] === networkVersion
    } catch (e) {
      return false
    }
  }
}
