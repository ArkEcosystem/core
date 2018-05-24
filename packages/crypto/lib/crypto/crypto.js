// const createHash = require('create-hash')
const bs58check = require('bs58check')
// const crypto = require('crypto')
const arkjsv1 = require('arkjsv1')
// const { Buffer } = require('buffer/')

const configManager = require('../managers/config')
const utils = require('./utils')
const ECPair = require('./ecpair')
const ECSignature = require('./ecsignature')
const feeManager = require('../managers/fee')

class Crypto {
  /**
   * Get transaction fee.
   * @param  {Transaction} transaction
   * @return {Number}
   */
  getFee (transaction) {
    return feeManager.get(transaction.type)
  }

  /**
   * Get the byte representation of the transaction.
   * @param  {Transaction} transaction
   * @param  {Boolean} skipSignature
   * @param  {Boolean} skipSecondSignature
   * @return {String}
   */
  getBytes (transaction, skipSignature, skipSecondSignature) {
    if (!transaction.version || transaction.version === 1) {
      return arkjsv1.crypto.getBytes(transaction, skipSignature, skipSecondSignature)
    }
  }

  /**
   * Get transaction id.
   * @param  {Transaction} transaction
   * @return {String}
   */
  getId (transaction) {
    if (!transaction.version || transaction.version === 1) {
      return arkjsv1.crypto.getId(transaction)
    }

    // TODO: Enable AIP11 id here
    // return crypto.createHash('sha256').update(this.getBytes(transaction)).digest()
  }

  /**
   * Get transaction hash.
   * @param  {Transaction} transaction
   * @return {Buffer}
   */
  getHash (transaction, skipSignature, skipSecondSignature) {
    if (!transaction.version || transaction.version === 1) {
      return arkjsv1.crypto.getHash(transaction, skipSignature, skipSecondSignature)
    }

    // TODO: Enable AIP11 id here
    // return crypto.createHash('sha256').update(this.getBytes(transaction)).digest()
  }

  /**
   * Sign transaction.
   * @param  {Transaction} transaction
   * @param  {Object}      keys
   * @return {Object}
   */
  sign (transaction, keys) {
    if (!transaction.version || transaction.version === 1) {
      return arkjsv1.crypto.sign(transaction, keys)
    }

    const hash = this.getHash(transaction, false, false)
    const signature = keys.sign(hash).toDER().toString('hex')

    if (!transaction.signature) {
      transaction.signature = signature
    }

    return signature
  }

  /**
   * Sign transaction with second signature.
   * @param  {Transaction} transaction
   * @param  {Object}      keys
   * @return {Object}
   */
  secondSign (transaction, keys) {
    if (!transaction.version || transaction.version === 1) {
      return arkjsv1.crypto.secondSign(transaction, keys)
    }

    const hash = this.getHash(transaction, false, true)
    const signature = keys.sign(hash).toDER().toString('hex')

    if (!transaction.secondSignature) {
      transaction.secondSignature = signature
    }

    return signature
  }

  /**
   * Verify transaction on the network.
   * @param  {Transaction}        transaction
   * @param  {(Number|undefined)} networkVersion
   * @return {Boolean}
   */
  verify (transaction, network) {
    if (!transaction.version || transaction.version === 1) {
      return arkjsv1.crypto.verify(transaction, network)
    }

    // TODO: enable AIP11 when ready here
    return false
  }

  /**
   * Verify second signature for transaction.
   * @param  {Transaction}        transaction
   * @param  {String}             publicKey
   * @param  {(Number|undefined)} networkVersion
   * @return {Boolean}
   */
  verifySecondSignature (transaction, publicKey, network) {
    if (!transaction.version || transaction.version === 1) {
      return arkjsv1.crypto.verifySecondSignature(transaction, publicKey, network)
    }

    const hash = this.getHash(transaction, false, true)

    const secondSignatureBuffer = Buffer.from(transaction.secondSignature, 'hex')
    const publicKeyBuffer = Buffer.from(publicKey, 'hex')
    const ecpair = ECPair.fromPublicKeyBuffer(publicKeyBuffer, network)
    const ecsignature = ECSignature.fromDER(secondSignatureBuffer)

    return ecpair.verify(hash, ecsignature)
  }

  /**
   * Get keys from secret.
   * @param  {String} secret
   * @param  {Object} options
   * @return {ECPair}
   */
  getKeys (secret, options) {
    const ecpair = ECPair.fromSeed(secret, options)
    ecpair.publicKey = ecpair.getPublicKeyBuffer().toString('hex')
    ecpair.privateKey = ''

    return ecpair
  }

  /**
   * Get address from public key.
   * @param  {String}             publicKey
   * @param  {(Number|undefined)} networkVersion
   * @return {String}
   */
  getAddress (publicKey, networkVersion) {
    if (!networkVersion) {
      networkVersion = configManager.get('pubKeyHash')
    }

    const buffer = utils.ripemd160(Buffer.from(publicKey, 'hex'))
    const payload = Buffer.alloc(21)

    payload.writeUInt8(networkVersion, 0)
    buffer.copy(payload, 1)

    return bs58check.encode(payload)
  }

  /**
   * Validate address.
   * @param  {String}             address
   * @param  {(Number|undefined)} networkVersion
   * @return {Boolean}
   */
  validateAddress (address, networkVersion) {
    if (!networkVersion) {
      networkVersion = configManager.get('pubKeyHash')
    }

    try {
      var decode = bs58check.decode(address)
      return decode[0] === networkVersion
    } catch (e) {
      return false
    }
  }

  /**
   * Validate public key.
   * @param  {String}             address
   * @param  {(Number|undefined)} networkVersion
   * @return {Boolean}
   */
  validatePublicKey (address, networkVersion) {
    if (!networkVersion) {
      networkVersion = configManager.get('pubKeyHash')
    }

    try {
      return this.getAddress(address, networkVersion).length === 34
    } catch (e) {
      return false
    }
  }
}

module.exports = new Crypto()
