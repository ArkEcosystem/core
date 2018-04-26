const bs58check = require('bs58check')
const ByteBuffer = require('bytebuffer')
const crypto = require('crypto')
const { Buffer } = require('buffer/')

const configManager = require('../managers/config')
const cryptoUtils = require('../crypto')
const ECPair = require('../crypto/ecpair')
const ECSignature = require('../crypto/ecsignature')
const { TRANSACTION_TYPES } = require('../constants')

const fixedPoint = Math.pow(10, 8)

class LegacyCryptoBuilder {
  /**
   * Check if object is an ECPair.
   * @param  {Object}  object
   * @return {Boolean}
   */
  isECPair (object) {
    return object instanceof ECPair
  }

  /**
   * Get signature bytes.
   * @param  {ECSignature} signature
   * @return {Uint8Array}
   */
  getSignatureBytes (signature) {
    const bb = new ByteBuffer(33, true)
    const publicKeyBuffer = new Buffer(signature.publicKey, 'hex')

    for (let i = 0; i < publicKeyBuffer.length; i++) {
      bb.writeByte(publicKeyBuffer[i])
    }

    bb.flip()
    return new Uint8Array(bb.toArrayBuffer())
  }

  /**
   * Get transaction as bytes.
   * @param  {Transaction} transaction
   * @param  {Boolean}     skipSignature
   * @param  {Boolean}     skipSecondSignature
   * @return {Buffer}
   */
  getBytes (transaction, skipSignature, skipSecondSignature) {
    if (!transaction.version) {
      transaction.version = 1
      transaction.network = configManager.get('pubKeyHash')
      transaction.expiration = 0
    }

    let assetSize = 0
    let assetBytes = null

    const actions = {
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => {
        assetBytes = this.getSignatureBytes(transaction.asset.signature)
        assetSize = assetBytes.length
      },
      [TRANSACTION_TYPES.DELEGATE]: () => {
        assetBytes = new Buffer(transaction.asset.delegate.username, 'utf8')
        assetSize = assetBytes.length
      },
      [TRANSACTION_TYPES.VOTE]: () => {
        if (transaction.asset.votes !== null) {
          assetBytes = new Buffer(transaction.asset.votes.join(''), 'utf8')
          assetSize = assetBytes.length
        }
      },
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: () => {
        const keysgroupBuffer = new Buffer(transaction.asset.multisignature.keysgroup.join(''), 'utf8')
        const bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true)

        bb.writeByte(transaction.asset.multisignature.min)
        bb.writeByte(transaction.asset.multisignature.lifetime)

        for (let i = 0; i < keysgroupBuffer.length; i++) {
          bb.writeByte(keysgroupBuffer[i])
        }

        bb.flip()

        assetBytes = bb.toBuffer()
        assetSize = assetBytes.length
      },
      'default': () => (false)
    }

    actions[transaction.type] ? actions[transaction.type]() : actions['default']()

    const bb = new ByteBuffer(1 + 4 + 32 + 8 + 8 + 21 + 64 + 64 + 64 + assetSize, true)
    bb.writeByte(transaction.type)
    bb.writeInt(transaction.timestamp)

    const senderPublicKeyBuffer = new Buffer(transaction.senderPublicKey, 'hex')
    for (let i = 0; i < senderPublicKeyBuffer.length; i++) {
      bb.writeByte(senderPublicKeyBuffer[i])
    }

    if (transaction.recipientId) {
      const recipient = bs58check.decode(transaction.recipientId)
      for (let i = 0; i < recipient.length; i++) {
        bb.writeByte(recipient[i])
      }
    } else {
      for (let i = 0; i < 21; i++) {
        bb.writeByte(0)
      }
    }

    if (transaction.vendorFieldHex) {
      const vf = new Buffer(transaction.vendorFieldHex, 'hex')
      const fillstart = vf.length
      for (let i = 0; i < fillstart; i++) {
        bb.writeByte(vf[i])
      }
      for (let i = fillstart; i < 64; i++) {
        bb.writeByte(0)
      }
    } else if (transaction.vendorField) {
      const vf = new Buffer(transaction.vendorField)
      const fillstart = vf.length
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

    bb.writeLong(transaction.amount)

    bb.writeLong(transaction.fee)

    if (assetSize > 0) {
      for (let i = 0; i < assetSize; i++) {
        bb.writeByte(assetBytes[i])
      }
    }

    if (!skipSignature && transaction.signature) {
      const signatureBuffer = new Buffer(transaction.signature, 'hex')
      for (let i = 0; i < signatureBuffer.length; i++) {
        bb.writeByte(signatureBuffer[i])
      }
    }

    if (!skipSecondSignature && transaction.signSignature) {
      const signSignatureBuffer = new Buffer(transaction.signSignature, 'hex')
      for (let i = 0; i < signSignatureBuffer.length; i++) {
        bb.writeByte(signSignatureBuffer[i])
      }
    }

    bb.flip()
    const arrayBuffer = new Uint8Array(bb.toArrayBuffer())
    const buffer = []

    for (let i = 0; i < arrayBuffer.length; i++) {
      buffer[i] = arrayBuffer[i]
    }

    return new Buffer(buffer)
  }

  /**
   * Get transaction from bytes.
   * @param  {String} hexString
   * @return {Object}
   */
  fromBytes (hexString) {
    const tx = {}
    const buf = new Buffer(hexString, 'hex')
    tx.type = buf.readInt8(0) & 0xff
    tx.timestamp = buf.readUInt32LE(1)
    tx.senderPublicKey = hexString.substring(10, 10 + 33 * 2)
    tx.amount = buf.readUInt32LE(38 + 21 + 64)
    tx.fee = buf.readUInt32LE(38 + 21 + 64 + 8)
    tx.vendorFieldHex = hexString.substring(76 + 42, 76 + 42 + 128)
    tx.recipientId = bs58check.encode(buf.slice(38, 38 + 21))

    const actions = {
      'default': () => (false),
      [TRANSACTION_TYPES.TRANSFER]: () => {
        this.parseSignatures(hexString, tx, 76 + 42 + 128 + 32)
      },
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => {
        delete tx.recipientId
        tx.asset = {
          signature: {
            publicKey: hexString.substring(76 + 42 + 128 + 32, 76 + 42 + 128 + 32 + 66)
          }
        }
        this.parseSignatures(hexString, tx, 76 + 42 + 128 + 32 + 66)
      },
      [TRANSACTION_TYPES.DELEGATE]: () => {
        delete tx.recipientId
        // Impossible to assess size of delegate asset, trying to grab signature and derive delegate asset
        const offset = this.findAndParseSignatures(hexString, tx)

        tx.asset = {
          delegate: {
            username: new Buffer(hexString.substring(76 + 42 + 128 + 32, hexString.length - offset), 'hex').toString('utf8')
          }
        }
      },
      [TRANSACTION_TYPES.VOTE]: () => {
        // Impossible to assess size of vote asset, trying to grab signature and derive vote asset
        const offset = this.findAndParseSignatures(hexString, tx)
        tx.asset = {
          votes: new Buffer(hexString.substring(76 + 42 + 128 + 32, hexString.length - offset), 'hex').toString('utf8').split(',')
        }
      },
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: () => {
        delete tx.recipientId
        const offset = this.findAndParseSignatures(hexString, tx)
        const buffer = new Buffer(hexString.substring(76 + 42 + 128 + 32, hexString.length - offset), 'hex')
        tx.asset = {
          multisignature: {}
        }
        tx.asset.multisignature.min = buffer.readInt8(0) & 0xff
        tx.asset.multisignature.lifetime = buffer.readInt8(1) & 0xff
        tx.asset.multisignature.keysgroup = []
        let index = 0
        while (index + 2 < buffer.length) {
          const key = buffer.slice(index + 2, index + 67 + 2).toString('utf8')
          tx.asset.multisignature.keysgroup.push(key)
          index = index + 67
        }
      },
      [TRANSACTION_TYPES.IPFS]: () => {
        delete tx.recipientId
        this.parseSignatures(hexString, tx, 76 + 42 + 128 + 32)
      }
    }

    actions[tx.type] ? actions[tx.type]() : actions['default']()

    return tx
  }

  /**
   * Parse signatures from transaction bytes.
   * @param  {String}      transactionBytes
   * @param  {Transaction} transaction
   * @return {Number}
   */
  findAndParseSignatures (transactionBytes, transaction) {
    let signature1 = new Buffer(transactionBytes.substring(transactionBytes.length-146), "hex")
    let found      = false
    let offset     = 0

    while (!found && signature1.length > 8) {
      if (signature1[0] !== 0x30) {
        signature1 = signature1.slice(1)
      } else {
        try {
          ECSignature.fromDER(signature1, 'hex')
          found = true
        } catch (error) {
          signature1 = signature1.slice(1)
        }
      }
    }

    if (!found) {
      offset = 0
      signature1 = null
    } else {
      found = false
      offset = signature1.length*2
      let signature2 = new Buffer(transactionBytes.substring(transactionBytes.length-offset-146, transactionBytes.length-offset), "hex")

      while (!found && signature2.length > 8) {
        if (signature2[0] !== 0x30) {
          signature2 = signature2.slice(1)
        } else {
          try {
            ECSignature.fromDER(signature2, 'hex')
            found = true
          } catch (error) {
            signature2 = signature2.slice(1)
          }
        }
      }
      if (!found) {
        signature2 = null
        transaction.signature = signature1.toString("hex")
        offset = transaction.signature.length
      } else if (signature2) {
        transaction.signSignature = signature1.toString("hex")
        transaction.signature = signature2.toString("hex")
        offset = transaction.signature.length+transaction.signSignature.length
      }
    }

    return offset
  }

  /**
   * Parse signatures from transaction bytes.
   * @param {String}      transactionBytes
   * @param {Transaction} transaction
   * @param {Number}      startOffset
   */
  parseSignatures (transactionBytes, transaction, startOffset) {
    transaction.signature = transactionBytes.substring(startOffset)
    if (transaction.signature.length == 0) {
      delete transaction.signature
    } else {
      const length = parseInt("0x" + transaction.signature.substring(2,4), 16) + 2
      transaction.signature = transactionBytes.substring(startOffset, startOffset + length*2)
      transaction.signSignature = transactionBytes.substring(startOffset + length*2)
      if (transaction.signSignature.length == 0) {
        delete transaction.signSignature
      }
    }
  }

  /**
   * Get transaction id.
   * @param  {Transaction} transaction
   * @return {String}
   */
  getId (transaction) {
    return crypto.createHash('sha256').update(this.getBytes(transaction)).digest().toString('hex')
  }

  /**
   * Get transaction hash
   * @param  {Transaction} transaction
   * @param  {Boolean}     skipSignature
   * @param  {Boolean}     skipSecondSignature
   * @return {Buffer}
   */
  getHash (transaction, skipSignature, skipSecondSignature) {
    return crypto.createHash('sha256').update(this.getBytes(transaction, skipSignature, skipSecondSignature)).digest()
  }

  /**
   * Get transaction fee.
   * @param  {Transaction} transaction
   * @return {Number}
   */
  getFee (transaction) {
    const actions = {
      'default': () => (false),
      [TRANSACTION_TYPES.TRANSFER]: () => {
        return 0.1 * fixedPoint
      },
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => {
        return 100 * fixedPoint
      },
      [TRANSACTION_TYPES.DELEGATE]: () => {
        return 10000 * fixedPoint
      },
      [TRANSACTION_TYPES.VOTE]: () => {
        return 1 * fixedPoint
      }
    }

    return actions[transaction.type] ? actions[transaction.type]() : actions['default']()
  }

  /**
   * Sign transaction.
   * @param  {Transaction} transaction
   * @param  {ECPair}      keys
   * @return {String}
   */
  sign (transaction, keys) {
    const hash = this.getHash(transaction, true, true)
    const signature = keys.sign(hash).toDER().toString('hex')

    if (!transaction.signature) {
      transaction.signature = signature
    }

    return signature
  }

  /**
   * Sign transaction with second signature.
   * @param  {Transaction} transaction
   * @param  {ECPair}      keys
   * @return {String}
   */
  secondSign (transaction, keys) {
    const hash = this.getHash(transaction, false, true)
    const signature = keys.sign(hash).toDER().toString('hex')

    if (!transaction.signSignature) {
      transaction.signSignature = signature
    }

    return signature
  }

  /**
   * Verify transaction
   * @param  {Transaction}        transaction
   * @param  {(Number|undefined)} networkVersion
   * @return {Boolean}
   */
  verify (transaction, networkVersion) {
    const hash = this.getHash(transaction, true, true)
    const signatureBuffer = new Buffer(transaction.signature, "hex")
    const senderPublicKeyBuffer = new Buffer(transaction.senderPublicKey, "hex")
    const ecpair = ECPair.fromPublicKeyBuffer(senderPublicKeyBuffer, networkVersion)
    const ecsignature = ECSignature.fromDER(signatureBuffer)
    const res = ecpair.verify(hash, ecsignature)

    return res
  }

  /**
   * Verify second signature for transaction.
   * @param  {Transaction}        transaction
   * @param  {String}             publicKey
   * @param  {(Number|undefined)} networkVersion
   * @return {Boolean}
   */
  verifySecondSignature (transaction, publicKey, networkVersion) {
    const hash = this.getHash(transaction, false, true)
    const signSignatureBuffer = new Buffer(transaction.signSignature, "hex")
    const publicKeyBuffer = new Buffer(publicKey, "hex")
    const ecpair = ECPair.fromPublicKeyBuffer(publicKeyBuffer, networkVersion)
    const ecsignature = ECSignature.fromDER(signSignatureBuffer)
    const res = ecpair.verify(hash, ecsignature)

    return res
  }

  /**
   * [getKeys description]
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

    const buffer = cryptoUtils.ripemd160(new Buffer(publicKey, 'hex'))

    const payload = new Buffer(21)
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
  validateAddress(address, networkVersion) {
    if (!networkVersion) {
      networkVersion = configManager.get('pubKeyHash')
    }
    try {
      const decode = bs58check.decode(address)
      return decode[0] == networkVersion
    } catch (e) {
      return false
    }
  }
}

module.exports = new LegacyCryptoBuilder()
