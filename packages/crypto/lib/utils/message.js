const crypto = require('crypto')
const { crypto: arkCrypto } = require('../crypto')

class Message {
  /**
   * Sign the given message.
   * @param  {String} message
   * @param  {String} passphrase
   * @return {Object}
   */
  sign (message, passphrase) {
    const keys = arkCrypto.getKeys(passphrase)

    return {
      publicKey: keys.publicKey,
      signature: arkCrypto.signHash(this.__createHash(message), keys),
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
  verify ({ message, publicKey, signature }) {
    return arkCrypto.verifyHash(this.__createHash(message), signature, publicKey)
  }

  /**
   * Create a new hash.
   * @param  {String} message
   * @return {String}
   */
  __createHash (message) {
    return crypto
      .createHash('sha256')
      .update(Buffer.from(message, 'utf-8'))
      .digest()
  }
}

module.exports = new Message()
