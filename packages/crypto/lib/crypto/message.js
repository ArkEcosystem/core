const crypto = require('crypto')
const arkCrypto = require('./crypto')

const createHash = message => crypto
    .createHash('sha256')
    .update(Buffer.from(message, 'utf-8'))
    .digest()

module.exports = class Message {
  /**
   * Sign the given message.
   * @param  {String} message
   * @param  {String} passphrase
   * @return {Object}
   */
  static sign (message, passphrase) {
    const keys = arkCrypto.getKeys(passphrase)

    return {
      publicKey: keys.publicKey,
      signature: arkCrypto.signHash(createHash(message), keys),
      message
    }
  }

  /**
   * Verify the given message.
   * @param  {String} options.message
   * @param  {String} options.publicKey
   * @param  {String} options.signature
   * @return {Boolean}
   */
  static verify ({ message, publicKey, signature }) {
    return arkCrypto.verifyHash(createHash(message), signature, publicKey)
  }
}
