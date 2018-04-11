const bs58check = require('bs58check')
const ByteBuffer = require('bytebuffer')
const configManager = require('../managers/config')
const { TRANSACTION_TYPES } = require('../constants')
const cryptoBuilder = require('../builder/crypto')

module.exports = class Transaction {
  /**
   * @constructor
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  constructor (transaction) {
    this.serialised = Transaction.serialise(transaction)
    this.data = Transaction.deserialise(this.serialised.toString('hex'))

    if (this.data.version === 1) {
      this.verified = cryptoBuilder.verify(this.data)
    }

    // if (this.data.amount !== transaction.amount) console.error('bang', transaction, this.data);

    [
      'id', 'version', 'timestamp', 'senderPublicKey', 'recipientId', 'type', 'vendorFieldHex',
      'amount', 'fee', 'blockId', 'signature', 'secondSignature'
    ].forEach((key) => { this[key] = this.data[key] }, this)
  }

  /**
   * [fromBytes description]
   * @param  {String} hexString [description]
   * @return {[type]}           [description]
   */
  static fromBytes (hexString) {
    return new Transaction(Transaction.deserialise(hexString))
  }

  /**
   * [verify description]
   * @return {[type]} [description]
   */
  verify () {
    if (!this.verified) return false
    return true
  }

  /**
   * [serialise description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  static serialise (transaction) {
    const bb = new ByteBuffer(512, true)
    bb.writeByte(0xff) // fill, to disambiguate from v1
    bb.writeByte(transaction.version || 0x01) // version
    bb.writeByte(transaction.network || configManager.get('pubKeyHash')) // ark = 0x17, devnet = 0x30
    bb.writeByte(transaction.type)
    bb.writeUInt32(transaction.timestamp)
    bb.append(transaction.senderPublicKey, 'hex')
    bb.writeUInt64(transaction.fee)
    if (transaction.vendorField) {
      let vf = Buffer.from(transaction.vendorField, 'utf8')
      bb.writeByte(vf.length)
      bb.append(vf)
    } else if (transaction.vendorFieldHex) {
      bb.writeByte(transaction.vendorFieldHex.length / 2)
      bb.append(transaction.vendorFieldHex, 'hex')
    } else {
      bb.writeByte(0x00)
    }

    const actions = {
      [TRANSACTION_TYPES.TRANSFER]: () => {
        bb.writeUInt64(transaction.amount)
        bb.writeUInt32(transaction.expiration || 0)
        bb.append(bs58check.decode(transaction.recipientId))
      },
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => {
        bb.append(transaction.asset.signature.publicKey, 'hex')
      },
      [TRANSACTION_TYPES.DELEGATE]: () => {
        const delegateBytes = Buffer.from(transaction.asset.delegate.username, 'utf8')
        bb.writeByte(delegateBytes.length)
        bb.append(delegateBytes, 'hex')
      },
      [TRANSACTION_TYPES.VOTE]: () => {
        const voteBytes = transaction.asset.votes.map(vote => (vote[0] === '+' ? '01' : '00') + vote.slice(1)).join('')
        bb.writeByte(transaction.asset.votes.length)
        bb.append(voteBytes, 'hex')
      },
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: () => {
        const keysgroupBuffer = Buffer.from(transaction.asset.multisignature.keysgroup.map(k => k.slice(1)).join(''), 'hex')
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
        bb.writeUInt64(transaction.amount)
        bb.writeByte(transaction.timelocktype)
        bb.writeUInt32(transaction.timelock)
        bb.append(bs58check.decode(transaction.recipientId))
      },
      [TRANSACTION_TYPES.MULTI_PAYMENT]: () => {
        bb.writeUInt32(transaction.asset.payments.length)
        transaction.asset.payments.forEach(p => {
          bb.writeUInt64(p.amount)
          bb.append(bs58check.decode(p.recipientId))
        })
      },
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: () => {
        // delegate resignation - empty payload
      }
    }

    actions[transaction.type]()

    if (transaction.signature) bb.append(transaction.signature, 'hex')
    if (transaction.secondSignature) bb.append(transaction.secondSignature, 'hex')
    else if (transaction.signSignature) bb.append(transaction.signSignature, 'hex')
    if (transaction.signatures) bb.append(transaction.signatures.join(''), 'hex')
    bb.flip()
    return bb.toBuffer()
  }

  /**
   * [deserialise description]
   * @param  {String} hexString [description]
   * @return {[type]}           [description]
   */
  static deserialise (hexString) {
    const transaction = {}
    const buf = ByteBuffer.fromHex(hexString, true)
    transaction.version = buf.readInt8(1)
    transaction.network = buf.readInt8(2)
    transaction.type = buf.readInt8(3)
    transaction.timestamp = buf.readUInt32(4)
    transaction.senderPublicKey = hexString.substring(16, 16 + 33 * 2)
    transaction.fee = buf.readUInt64(41).toNumber()
    const vflength = buf.readInt8(41 + 8)
    if (vflength > 0) {
      transaction.vendorFieldHex = hexString.substring((41 + 8 + 1) * 2, (41 + 8 + 1) * 2 + vflength * 2)
    }

    const assetOffset = (41 + 8 + 1) * 2 + vflength * 2

    const actions = {
      [TRANSACTION_TYPES.TRANSFER]: () => {
        transaction.amount = buf.readUInt64(assetOffset / 2).toNumber()
        transaction.expiration = buf.readUInt32(assetOffset / 2 + 8)
        transaction.recipientId = bs58check.encode(buf.buffer.slice(assetOffset / 2 + 12, assetOffset / 2 + 12 + 21))
        Transaction.parseSignatures(hexString, transaction, assetOffset + (21 + 12) * 2)
      },
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => {
        transaction.asset = {
          signature: {
            publicKey: hexString.substring(assetOffset, assetOffset + 66)
          }
        }
        Transaction.parseSignatures(hexString, transaction, assetOffset + 66)
      },
      [TRANSACTION_TYPES.DELEGATE]: () => {
        const usernamelength = buf.readInt8(assetOffset / 2) & 0xff

        transaction.asset = {
          delegate: {
            username: buf.slice(assetOffset / 2 + 1, assetOffset / 2 + 1 + usernamelength).toString('utf8')
          }
        }
        Transaction.parseSignatures(hexString, transaction, assetOffset + (usernamelength + 1) * 2)
      },
      [TRANSACTION_TYPES.VOTE]: () => {
        const votelength = buf.readInt8(assetOffset / 2) & 0xff
        transaction.asset = {
          votes: []
        }
        let vote
        for (let i = 0; i < votelength; i++) {
          vote = hexString.substring(assetOffset + 2 + i * 2 * 34, assetOffset + 2 + (i + 1) * 2 * 34)
          vote = (vote[1] === '1' ? '+' : '-') + vote.slice(2)
          transaction.asset.votes.push(vote)
        }
        Transaction.parseSignatures(hexString, transaction, assetOffset + 2 + votelength * 34 * 2)
      },
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: () => {
        transaction.asset = {
          multisignature: {}
        }
        transaction.asset.multisignature.min = buf.readInt8(assetOffset / 2) & 0xff
        const num = buf.readInt8(assetOffset / 2 + 1) & 0xff
        transaction.asset.multisignature.lifetime = buf.readInt8(assetOffset / 2 + 2) & 0xff
        transaction.asset.multisignature.keysgroup = []
        for (let index = 0; index < num; index++) {
          const key = hexString.slice(assetOffset + 6 + index * 66, assetOffset + 6 + (index + 1) * 66)
          transaction.asset.multisignature.keysgroup.push(key)
        }
        Transaction.parseSignatures(hexString, transaction, assetOffset + 6 + num * 66)
      },
      [TRANSACTION_TYPES.IPFS]: () => {
        transaction.asset = {}
        const l = buf.readInt8(assetOffset / 2) & 0xff
        transaction.asset.dag = hexString.substring(assetOffset + 2, assetOffset + 2 + l * 2)
        Transaction.parseSignatures(hexString, transaction, assetOffset + 2 + l * 2)
      },
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: () => {
        transaction.amount = buf.readUInt64(assetOffset / 2).toNumber()
        transaction.timelocktype = buf.readInt8(assetOffset / 2 + 8) & 0xff
        transaction.timelock = buf.readUInt64(assetOffset / 2 + 9).toNumber()
        transaction.recipientId = bs58check.encode(buf.buffer.slice(assetOffset / 2 + 13, assetOffset / 2 + 13 + 21))
        Transaction.parseSignatures(hexString, transaction, assetOffset + (21 + 13) * 2)
      },
      [TRANSACTION_TYPES.MULTI_PAYMENT]: () => {
        transaction.asset = {
          payments: []
        }
        const total = buf.readInt8(assetOffset / 2) & 0xff
        let offset = assetOffset / 2 + 1
        for (let j = 0; j < total; j++) {
          const payment = {}
          payment.amount = buf.readUInt64(offset).toNumber()
          payment.recipientId = bs58check.encode(buf.buffer.slice(offset + 1, offset + 1 + 21))
          transaction.asset.payments.push(payment)
          offset += 22
        }
        transaction.amount = transaction.asset.payments.reduce((a, p) => (a += p.amount), 0)
        Transaction.parseSignatures(hexString, transaction, offset * 2)
      },
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: () => {
        Transaction.parseSignatures(hexString, transaction, assetOffset)
      }
    }

    actions[transaction.type]()

    if (!transaction.amount) {
      transaction.amount = 0
    }

    if (transaction.version === 1) {
      if (transaction.secondSignature) {
        transaction.signSignature = transaction.secondSignature
      }

      if (!transaction.recipientId && transaction.type === TRANSACTION_TYPES.VOTE) {
        transaction.recipientId = cryptoBuilder.getAddress(transaction.senderPublicKey, transaction.network)
      }

      if (transaction.vendorFieldHex) {
        transaction.vendorField = Buffer.from(transaction.vendorFieldHex, 'hex').toString('utf8')
      }

      if (transaction.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
        transaction.asset.multisignature.keysgroup = transaction.asset.multisignature.keysgroup.map((k) => '+' + k)
        transaction.recipientId = cryptoBuilder.getAddress(transaction.senderPublicKey, transaction.network)
      }

      if (!transaction.id) {
        transaction.id = cryptoBuilder.getId(transaction)
      }
    }
    return transaction
  }

  /**
   * TODO: support multisignatures
   *
   * [parseSignatures description]
   * @param  {String} hexString   [description]
   * @param  {[type]} transaction [description]
   * @param  {Number} startOffset [description]
   * @return {[type]}             [description]
   */
  static parseSignatures (hexString, transaction, startOffset) {
    transaction.signature = hexString.substring(startOffset)

    let multioffset = 0
    if (transaction.signature.length === 0) {
      delete transaction.signature
    } else {
      const length1 = parseInt('0x' + transaction.signature.substring(2, 4), 16) + 2
      transaction.signature = hexString.substring(startOffset, startOffset + length1 * 2)
      multioffset += length1 * 2
      transaction.secondSignature = hexString.substring(startOffset + length1 * 2)

      if (transaction.secondSignature.length === 0) {
        delete transaction.secondSignature
      } else {
        const length2 = parseInt('0x' + transaction.secondSignature.substring(2, 4), 16) + 2
        transaction.secondSignature = transaction.secondSignature.substring(0, length2 * 2)
        multioffset += length2 * 2
      }

      if (transaction.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
        let signatures = hexString.substring(startOffset + multioffset)
        transaction.signatures = []

        for (let i = 0; i < transaction.asset.multisignature.keysgroup.length; i++) {
          const mlength = parseInt('0x' + signatures.substring(2, 4), 16) + 2
          transaction.signatures.push(signatures.substring(0, mlength * 2))
          signatures = signatures.substring(mlength * 2)
        }
      }
    }
  }
}
