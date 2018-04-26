const bs58check = require('bs58check')
const crypto = require('crypto')
const arkjsv1 = require('arkjsv1')
// const { Buffer } = require('buffer/')

const configManager = require('../managers/config')
const cryptoUtils = require('../crypto')
const ECPair = require('../crypto/ecpair')
const ECSignature = require('../crypto/ecsignature')
const feeManager = require('../managers/fee')

class CryptoBuilder {

  /**
   * [getId description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  getId (transaction) {
    if (transaction.version === 1) return arkjsv1.crypto.getId(transaction)
    // TODO: Enable AIP11 id here
    else return crypto.createHash('sha256').update(this.getBytes(transaction)).digest()
  }

  /**
   * [getHash description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  getHash (transaction, skipSignature, skipSecondSignature) {
    if (transaction.version === 1) return arkjsv1.crypto.getHash(transaction, skipSignature, skipSecondSignature)
    // else return crypto.createHash('sha256').update(this.getBytes(transaction)).digest()
  }

  /**
   * [getFee description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  getFee (transaction) {
    return feeManager.get(transaction.type)
  }

  /**
   * [sign description]
   * @param  {[type]} transaction [description]
   * @param  {[type]} keys        [description]
   * @return {[type]}             [description]
   */
  sign (transaction, keys) {
    const hash = this.getHash(transaction, false, false)
    const signature = keys.sign(hash).toDER().toString('hex')

    if (!transaction.signature) {
      transaction.signature = signature
    }

    return signature
  }

  /**
   * [secondSign description]
   * @param  {[type]} transaction [description]
   * @param  {[type]} keys        [description]
   * @return {[type]}             [description]
   */
  secondSign (transaction, keys) {
    const hash = this.getHash(transaction, false, true)
    const signature = keys.sign(hash).toDER().toString('hex')

    if (!transaction.secondSignature) {
      transaction.secondSignature = signature
    }

    return signature
  }

  /**
   * [verify description]
   * @param  {[type]} transaction [description]
   * @param  {[type]} network     [description]
   * @return {[type]}             [description]
   */
  verify (transaction, network) {
    if (transaction.version === 1) return arkjsv1.crypto.verify(transaction, network)
    // TODO: enable AIP11 when ready here
    else return false
  }

  /**
   * [verifySecondSignature description]
   * @param  {[type]} transaction [description]
   * @param  {String} publicKey   [description]
   * @param  {[type]} network     [description]
   * @return {[type]}             [description]
   */
  verifySecondSignature (transaction, publicKey, network) {
    const hash = this.getHash(transaction, false, true)

    const secondSignatureBuffer = Buffer.from(transaction.secondSignature, 'hex')
    const publicKeyBuffer = Buffer.from(publicKey, 'hex')
    const ecpair = ECPair.fromPublicKeyBuffer(publicKeyBuffer, network)
    const ecsignature = ECSignature.fromDER(secondSignatureBuffer)

    return ecpair.verify(hash, ecsignature)
  }

  /**
   * [getKeys description]
   * @param  {String} secret  [description]
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  getKeys (secret, options) {
    const ecpair = ECPair.fromSeed(secret, options)
    ecpair.publicKey = ecpair.getPublicKeyBuffer().toString('hex')
    ecpair.privateKey = ''

    return ecpair
  }

  /**
   * [getAddress description]
   * @param  {String} publicKey [description]
   * @param  {[type]} [version] [description]
   * @return {[type]}           [description]
   */
  getAddress (publicKey, version) {
    if (!version) {
      version = configManager.get('pubKeyHash')
    }

    const buffer = cryptoUtils.ripemd160(Buffer.from(publicKey, 'hex'))
    const payload = Buffer.alloc(21)

    payload.writeUInt8(version, 0)
    buffer.copy(payload, 1)

    return bs58check.encode(payload)
  }

  /**
   * [validateAddress description]
   * @param  {String} address   [description]
   * @param  {[type]} [version] [description]
   * @return {[type]}           [description]
   */
  validateAddress (address, version) {
    if (!version) {
      version = configManager.get('pubKeyHash')
    }
    try {
      var decode = bs58check.decode(address)
      return decode[0] === version
    } catch (e) {
      return false
    }
  }

  /**
   * [validatePublicKey description]
   * @param  {[type]} address [description]
   * @param  {[type]} version [description]
   * @return {[type]}         [description]
   */
  validatePublicKey (address, version) {
    if (!version) {
      version = configManager.get('pubKeyHash')
    }

    try {
      return this.getAddress(address, version).length === 34
    } catch (e) {
      return false
    }
  }
}

module.exports = new CryptoBuilder()
