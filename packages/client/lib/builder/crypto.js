const bs58check = require('bs58check')
const ByteBuffer = require('bytebuffer')
const crypto = require('crypto')
const arkjsv1 = require('arkjs')
// const { Buffer } = require('buffer/')

const configManager = require('../managers/config')
const cryptoUtils = require('../crypto')
const ECPair = require('../crypto/ecpair')
const ECSignature = require('../crypto/ecsignature')
const feeManager = require('../managers/fee')
const { TRANSACTION_TYPES } = require('../constants')

class CryptoBuilder {
  /**
   * [getBytes description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  getBytes (transaction) {
    if (!transaction.version) {
      transaction.version = 1
      transaction.network = configManager.get('pubKeyHash')
      transaction.expiration = 0
    }
    const bb = new ByteBuffer(512, true)
    bb.writeByte(0xff) // fill, to disambiguate from v1
    bb.writeByte(transaction.version) // version 2
    bb.writeByte(transaction.network) // ark = 0x17, devnet = 0x30
    bb.writeByte(transaction.type)
    bb.writeInt(transaction.timestamp)
    // FIXME: TypeError: Illegal buffer
    bb.append(transaction.senderPublicKey, 'hex')
    bb.writeLong(transaction.fee)
    if (transaction.vendorFieldHex) {
      bb.writeByte(transaction.vendorFieldHex.length / 2)
      bb.append(transaction.vendorFieldHex, 'hex')
    } else {
      bb.writeByte(0x00)
    }

    const actions = {
      [TRANSACTION_TYPES.TRANSFER]: () => {
        bb.writeLong(transaction.amount)
        bb.writeInt(transaction.expiration)
        bb.append(bs58check.decode(transaction.recipientId))
      },
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => {
        bb.append(transaction.asset.signature.publicKey, 'hex')
      },
      [TRANSACTION_TYPES.DELEGATE]: () => {
        const delegateBytes = Buffer.from(transaction.asset.delegate.username, 'utf8')
        bb.writeByte(delegateBytes.length / 2)
        bb.append(delegateBytes, 'hex')
      },
      [TRANSACTION_TYPES.VOTE]: () => {
        const voteBytes = transaction.asset.votes.map(function (vote) {
          return (vote[0] === '+' ? '01' : '00') + vote.slice(1)
        }).join('')
        bb.writeByte(transaction.asset.votes.length)
        bb.append(voteBytes, 'hex')
      },
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: () => {
        const keysgroupBuffer = Buffer.from(transaction.asset.multisignature.keysgroup.join(''), 'hex')
        bb.writeByte(transaction.asset.multisignature.min)
        bb.writeByte(transaction.asset.multisignature.keysgroup.length)
        bb.writeByte(transaction.asset.multisignature.lifetime)
        bb.append(keysgroupBuffer, 'hex')
      },
      [TRANSACTION_TYPES.IPFS]: () => {
        bb.writeByte(transaction.asset.ipfs.dag.length / 2)
        bb.append(transaction.asset.ipfs.dag, 'hex')
      },
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: () => {
        bb.writeLong(transaction.amount)
        bb.writeByte(transaction.timelocktype)
        bb.writeInt(transaction.timelock)
        bb.append(bs58check.decode(transaction.recipientId))
      },
      [TRANSACTION_TYPES.MULTI_PAYMENT]: () => {
        bb.writeInt(transaction.asset.payments.length)
        transaction.asset.payments.forEach(function (p) {
          bb.writeLong(p.amount)
          bb.append(bs58check.decode(p.recipientId))
        })
      },
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: () => {}
    }

    actions[transaction.type]()

    bb.flip()
    return bb.toBuffer()
  }

  /**
   * [fromBytes description]
   * @param  {String} hexString [description]
   * @return {[type]}           [description]
   */
  fromBytes (hexString) {
    let tx = {}
    const buf = Buffer.from(hexString, 'hex')
    tx.version = buf.readInt8(1) & 0xff
    tx.network = buf.readInt8(2) & 0xff
    tx.type = buf.readInt8(3) & 0xff
    tx.timestamp = buf.readUInt32LE(4)
    tx.senderPublicKey = hexString.substring(16, 16 + 33 * 2)
    tx.fee = buf.readUInt32LE(41)
    const vflength = buf.readInt8(41 + 8) & 0xff
    if (vflength > 0) {
      tx.vendorFieldHex = hexString.substring((41 + 8 + 1) * 2, (41 + 8 + 1) * 2 + vflength * 2)
    }

    const assetOffset = (41 + 8 + 1) * 2 + vflength * 2

    const actions = {
      [TRANSACTION_TYPES.TRANSFER]: () => {
        tx.amount = buf.readUInt32LE(assetOffset / 2)
        tx.expiration = buf.readUInt32LE(assetOffset / 2 + 8)
        tx.recipientId = bs58check.encode(buf.slice(assetOffset / 2 + 12, assetOffset / 2 + 12 + 21))
        this.parseSignatures(hexString, tx, assetOffset + (21 + 12) * 2)
      },
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => {
        tx.asset = {
          signature: {
            publicKey: hexString.substring(assetOffset, assetOffset + 66)
          }
        }
        this.parseSignatures(hexString, tx, assetOffset + 66)
      },
      [TRANSACTION_TYPES.DELEGATE]: () => {
        const usernamelength = buf.readInt8(assetOffset / 2) & 0xff

        tx.asset = {
          delegate: {
            username: buf.slice(assetOffset / 2 + 1, assetOffset / 2 + 1 + usernamelength).toString('utf8')
          }
        }
        this.parseSignatures(hexString, tx, assetOffset + (usernamelength + 1) * 2)
      },
      [TRANSACTION_TYPES.VOTE]: () => {
        const votelength = buf.readInt8(assetOffset / 2) & 0xff
        tx.asset = {
          votes: []
        }
        let vote
        for (let i = 0; i < votelength; i++) {
          vote = hexString.substring(assetOffset + 2 + i * 2 * 34, assetOffset + 2 + (i + 1) * 2 * 34)
          vote = (vote[1] === '1' ? '+' : '-') + vote.slice(2)
          tx.asset.votes.push(vote)
        }
        this.parseSignatures(hexString, tx, assetOffset + 2 + votelength * 34 * 2)
      },
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: () => {
        tx.asset = {
          multisignature: {}
        }
        tx.asset.multisignature.min = buf.readInt8(assetOffset / 2) & 0xff
        const num = buf.readInt8(assetOffset / 2 + 1) & 0xff
        tx.asset.multisignature.lifetime = buf.readInt8(assetOffset / 2 + 2) & 0xff
        tx.asset.multisignature.keysgroup = []
        for (let index = 0; index < num; index++) {
          let key = hexString.slice(assetOffset + 6 + index * 66, assetOffset + 6 + (index + 1) * 66) // eslint-disable-line no-unused-vars
        }
        this.parseSignatures(hexString, tx, assetOffset + 6 + num * 66)
      },
      [TRANSACTION_TYPES.IPFS]: () => {
        tx.asset = {}
        const l = buf.readInt8(assetOffset / 2) & 0xff
        tx.asset.dag = hexString.substring(assetOffset + 2, assetOffset + 2 + l * 2)
        this.parseSignatures(hexString, tx, assetOffset + 2 + l * 2)
      },
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: () => {
        tx.amount = buf.readUInt32LE(assetOffset / 2)
        tx.timelocktype = buf.readInt8(assetOffset / 2 + 8) & 0xff
        tx.timelock = buf.readUInt32LE(assetOffset / 2 + 9)
        tx.recipientId = bs58check.encode(buf.slice(assetOffset / 2 + 13, assetOffset / 2 + 13 + 21))
        this.parseSignatures(hexString, tx, assetOffset + (21 + 13) * 2)
      },
      [TRANSACTION_TYPES.MULTI_PAYMENT]: () => {
        tx.asset = {
          payments: []
        }
        const total = buf.readInt8(assetOffset / 2) & 0xff
        let offset = assetOffset / 2 + 1
        for (let i = 0; i < total; i++) {
          let payment = {}
          payment.amount = buf.readUInt32LE(offset)
          payment.recipientId = bs58check.encode(buf.slice(offset + 1, offset + 1 + 21))
          tx.asset.payments.push(payment)
          offset += 22
        }
        this.parseSignatures(hexString, tx, offset * 2)
      },
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: () => {
        this.parseSignatures(hexString, tx, assetOffset)
      }
    }

    actions[tx.type]()

    return tx
  }

  /**
   * [parseSignatures description]
   * @param  {String} hexString   [description]
   * @param  {[type]} tx          [description]
   * @param  {[type]} startOffset [description]
   * @return {[type]}             [description]
   */
  parseSignatures (hexString, tx, startOffset) {
    tx.signature = hexString.substring(startOffset)
    if (tx.signature.length === 0) delete tx.signature
    else {
      const length = parseInt('0x' + tx.signature.substring(2, 4), 16) + 2
      tx.signature = hexString.substring(startOffset, startOffset + length * 2)
      tx.secondSignature = hexString.substring(startOffset + length * 2)
      if (tx.secondSignature.length === 0) delete tx.secondSignature
    }
  }

  /**
   * [getId description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  getId (transaction) {
    // FIXME: @fix added this and this currently doesn't use the network the configManager uses
    return arkjsv1.crypto.getId(transaction)
  }

  /**
   * [getHash description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  getHash (transaction) {
    return crypto.createHash('sha256').update(this.getBytes(transaction)).digest()
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
    const hash = this.getHash(transaction)
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
    const hash = this.getHash(transaction)
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
    // FIXME: @fix added this and this currently doesn't use the network the configManager uses
    return arkjsv1.crypto.verify(transaction, network)
  }

  /**
   * [verifySecondSignature description]
   * @param  {[type]} transaction [description]
   * @param  {String} publicKey   [description]
   * @param  {[type]} network     [description]
   * @return {[type]}             [description]
   */
  verifySecondSignature (transaction, publicKey, network) {
    const hash = this.getHash(transaction)

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
}

module.exports = new CryptoBuilder()
