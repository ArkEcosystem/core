// const createHash = require('create-hash')
const bs58check = require('bs58check')
const crypto = require('crypto')
// const { Buffer } = require('buffer/')
var ByteBuffer = require('bytebuffer');

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
    if (transaction.version && transaction.version !== 1) {
      throw new Error('not supported yet')
    }

    let assetSize = 0
    let assetBytes = null

    switch (transaction.type) {
      case 1: { // Signature
        const { signature } = transaction.asset
        let bb = new ByteBuffer(33, true)
        let publicKeyBuffer = Buffer.from(signature.publicKey, 'hex');

        for (let i = 0; i < publicKeyBuffer.length; i++) {
          bb.writeByte(publicKeyBuffer[i]);
        }

        bb.flip()

        assetBytes = new Uint8Array(bb.toArrayBuffer())
        assetSize = assetBytes.length
        break
      }

      case 2: { // Delegate
        assetBytes = Buffer.from(transaction.asset.delegate.username, 'utf8')
        assetSize = assetBytes.length
        break
      }

      case 3: { // Vote
        if (transaction.asset.votes !== null) {
          assetBytes = Buffer.from(transaction.asset.votes.join(''), 'utf8')
          assetSize = assetBytes.length
        }
        break
      }

      case 4: { // Multi-Signature
        let keysgroupBuffer = Buffer.from(transaction.asset.multisignature.keysgroup.join(''), 'utf8')
        let bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true)

        bb.writeByte(transaction.asset.multisignature.min)
        bb.writeByte(transaction.asset.multisignature.lifetime)

        for (let i = 0; i < keysgroupBuffer.length; i++) {
          bb.writeByte(keysgroupBuffer[i])
        }

        bb.flip()

        assetBytes = bb.toBuffer()
        assetSize = assetBytes.length
        break
      }
    }

    let bb = new ByteBuffer(1 + 4 + 32 + 8 + 8 + 21 + 64 + 64 + 64 + assetSize, true)
    bb.writeByte(transaction.type)
    bb.writeInt(transaction.timestamp)

    let senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, 'hex')
    for (let i = 0; i < senderPublicKeyBuffer.length; i++) {
      bb.writeByte(senderPublicKeyBuffer[i])
    }

    if (transaction.recipientId) {
      let recipient = bs58check.decode(transaction.recipientId)
      for (let i = 0; i < recipient.length; i++) {
        bb.writeByte(recipient[i])
      }
    } else {
      for (let i = 0; i < 21; i++) {
        bb.writeByte(0);
      }
    }

    if (transaction.vendorFieldHex) {
      let vf = Buffer.from(transaction.vendorFieldHex, 'hex');
      let fillstart = vf.length
      for (let i = 0; i < fillstart; i++) {
        bb.writeByte(vf[i])
      }
      for (let i = fillstart; i < 64; i++) {
        bb.writeByte(0)
      }
    } else if (transaction.vendorField) {
      let vf = Buffer.from(transaction.vendorField);
      let fillstart = vf.length
      for (let i = 0; i < fillstart; i++) {
        bb.writeByte(vf[i])
      }
      for (let i = fillstart; i < 64; i++) {
        bb.writeByte(0)
      }
    } else {
      for (let i = 0; i < 64; i++) {
        bb.writeByte(0)
      }
    }

    bb.writeLong(+transaction.amount.toString())
    bb.writeLong(+transaction.fee.toString())

    if (assetSize > 0) {
      for (let i = 0; i < assetSize; i++) {
        bb.writeByte(assetBytes[i])
      }
    }

    if (!skipSignature && transaction.signature) {
      let signatureBuffer = Buffer.from(transaction.signature, 'hex')
      for (let i = 0; i < signatureBuffer.length; i++) {
        bb.writeByte(signatureBuffer[i])
      }
    }

    if (!skipSecondSignature && transaction.signSignature) {
      let signSignatureBuffer = Buffer.from(transaction.signSignature, 'hex')
      for (let i = 0; i < signSignatureBuffer.length; i++) {
        bb.writeByte(signSignatureBuffer[i])
      }
    }

    bb.flip()
    let arrayBuffer = new Uint8Array(bb.toArrayBuffer())
    let buffer = []

    for (let i = 0; i < arrayBuffer.length; i++) {
      buffer[i] = arrayBuffer[i]
    }

    return Buffer.from(buffer)
  }

  /**
   * Get transaction id.
   * @param  {Transaction} transaction
   * @return {String}
   */
  getId (transaction) {
    if (transaction.version && transaction.version !== 1) {
      throw new Error('not supported yet')
    }

    const bytes = this.getBytes(transaction)
    return crypto.createHash('sha256').update(bytes).digest().toString('hex')

    // TODO: Enable AIP11 id here
  }

  /**
   * Get transaction hash.
   * @param  {Transaction} transaction
   * @return {Buffer}
   */
  getHash (transaction, skipSignature, skipSecondSignature) {
    if (transaction.version && transaction.version !== 1) {
      throw new Error('not supported yet')
    }

    const bytes = this.getBytes(transaction, skipSignature, skipSecondSignature)
    return crypto.createHash('sha256').update(bytes).digest()

    // TODO: Enable AIP11 id here
  }

  /**
   * Sign transaction.
   * @param  {Transaction} transaction
   * @param  {Object}      keys
   * @return {Object}
   */
  sign (transaction, keys) {
    let hash
    if (!transaction.version || transaction.version === 1) {
      hash = this.getHash(transaction, true, true)
    } else {
      hash = this.getHash(transaction, false, false)
    }

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
   * @param  {(Object|undefined)} network
   * @return {Boolean}
   */
  verify (transaction, network) {
    if (transaction.version && transaction.version !== 1) {
      // TODO: enable AIP11 when ready here
      return false
    }

    if (!network) {
      network = configManager.config
    }

    const hash = this.getHash(transaction, true, true)
    const signatureBuffer = Buffer.from(transaction.signature, 'hex')
    const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, 'hex')
    const ecpair = ECPair.fromPublicKeyBuffer(senderPublicKeyBuffer, network)
    const ecsignature = ECSignature.fromDER(signatureBuffer)

    return ecpair.verify(hash, ecsignature)
  }

  /**
   * Verify second signature for transaction.
   * @param  {Transaction}        transaction
   * @param  {String}             publicKey
   * @param  {(Object|undefined)} network
   * @return {Boolean}
   */
  verifySecondSignature (transaction, publicKey, network) {
    if (!network) {
      network = configManager.config
    }

    let hash
    let secondSignature
    if (transaction.version && transaction.version !== 1) {
      hash = this.getHash(transaction)
      secondSignature = transaction.secondSignature
    } else {
      hash = this.getHash(transaction, false, true)
      secondSignature = transaction.signSignature
    }

    if (!secondSignature) {
      return false
    }

    const secondSignatureBuffer = Buffer.from(secondSignature, 'hex')
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
    var pubKeyRegex = /^[0-9A-Fa-f]{66}$/;
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
