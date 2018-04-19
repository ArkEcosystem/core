const bs58check = require('bs58check')
const ByteBuffer = require('bytebuffer')
const crypto = require('crypto')
const configManager = require('../managers/config')
const { TRANSACTION_TYPES } = require('../constants')
const arkjsv1 = require('arkjs')

module.exports = class Transaction {
  constructor (transaction) {
    this.serialized = Transaction.serialize(transaction)
    this.data = Transaction.deserialize(this.serialized.toString('hex'))
    if (this.data.version === 1) {
      this.verified = arkjsv1.crypto.verify(this.data)
    }
    // if (this.data.amount !== transaction.amount) console.error('bang', transaction, this.data);
    ['id', 'version', 'timestamp', 'senderPublicKey', 'recipientId', 'type', 'vendorFieldHex', 'amount', 'fee', 'blockId', 'signature', 'secondSignature'].forEach((key) => {
      this[key] = this.data[key]
    }, this)
  }

  static fromBytes (hexString) {
    return new Transaction(Transaction.deserialize(hexString))
  }

  verify () {
    if (!this.verified) return false
    return true
  }

  // AIP11 serialization
  static serialize (transaction) {
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
        let joined = null
        if (!transaction.version || transaction.version === 1) joined = transaction.asset.multisignature.keysgroup.map(k => k.slice(1)).join('')
        else joined = transaction.asset.multisignature.keysgroup.join('')
        const keysgroupBuffer = Buffer.from(joined, 'hex')
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
    if (transaction.signatures) {
      bb.append('ff', 'hex')
      bb.append(transaction.signatures.join(''), 'hex')
    }
    bb.flip()
    return bb.toBuffer()
  }

  static deserialize (hexString) {
    const tx = {}
    const buf = ByteBuffer.fromHex(hexString, true)
    tx.version = buf.readInt8(1)
    tx.network = buf.readInt8(2)
    tx.type = buf.readInt8(3)
    tx.timestamp = buf.readUInt32(4)
    tx.senderPublicKey = hexString.substring(16, 16 + 33 * 2)
    tx.fee = buf.readUInt64(41).toNumber()
    const vflength = buf.readInt8(41 + 8)
    if (vflength > 0) {
      tx.vendorFieldHex = hexString.substring((41 + 8 + 1) * 2, (41 + 8 + 1) * 2 + vflength * 2)
    }

    const assetOffset = (41 + 8 + 1) * 2 + vflength * 2

    if (tx.type === TRANSACTION_TYPES.TRANSFER) {
      tx.amount = buf.readUInt64(assetOffset / 2).toNumber()
      tx.expiration = buf.readUInt32(assetOffset / 2 + 8)
      tx.recipientId = bs58check.encode(buf.buffer.slice(assetOffset / 2 + 12, assetOffset / 2 + 12 + 21))
      Transaction.parseSignatures(hexString, tx, assetOffset + (21 + 12) * 2)
    } else if (tx.type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      tx.asset = {
        signature: {
          publicKey: hexString.substring(assetOffset, assetOffset + 66)
        }
      }
      Transaction.parseSignatures(hexString, tx, assetOffset + 66)
    } else if (tx.type === TRANSACTION_TYPES.DELEGATE) {
      const usernamelength = buf.readInt8(assetOffset / 2) & 0xff

      tx.asset = {
        delegate: {
          username: buf.slice(assetOffset / 2 + 1, assetOffset / 2 + 1 + usernamelength).toString('utf8')
        }
      }
      Transaction.parseSignatures(hexString, tx, assetOffset + (usernamelength + 1) * 2)
    } else if (tx.type === TRANSACTION_TYPES.VOTE) {
      const votelength = buf.readInt8(assetOffset / 2) & 0xff
      tx.asset = { votes: [] }
      let vote
      for (let i = 0; i < votelength; i++) {
        vote = hexString.substring(assetOffset + 2 + i * 2 * 34, assetOffset + 2 + (i + 1) * 2 * 34)
        vote = (vote[1] === '1' ? '+' : '-') + vote.slice(2)
        tx.asset.votes.push(vote)
      }
      Transaction.parseSignatures(hexString, tx, assetOffset + 2 + votelength * 34 * 2)
    } else if (tx.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
      tx.asset = { multisignature: { keysgroup: [] } }
      tx.asset.multisignature.min = buf.readInt8(assetOffset / 2) & 0xff
      const num = buf.readInt8(assetOffset / 2 + 1) & 0xff
      tx.asset.multisignature.lifetime = buf.readInt8(assetOffset / 2 + 2) & 0xff
      for (let index = 0; index < num; index++) {
        const key = hexString.slice(assetOffset + 6 + index * 66, assetOffset + 6 + (index + 1) * 66)
        tx.asset.multisignature.keysgroup.push(key)
      }
      Transaction.parseSignatures(hexString, tx, assetOffset + 6 + num * 66)
    } else if (tx.type === TRANSACTION_TYPES.IPFS) {
      tx.asset = {}
      const l = buf.readInt8(assetOffset / 2) & 0xff
      tx.asset.dag = hexString.substring(assetOffset + 2, assetOffset + 2 + l * 2)
      Transaction.parseSignatures(hexString, tx, assetOffset + 2 + l * 2)
    } else if (tx.type === TRANSACTION_TYPES.TIMELOCK_TRANSFER) {
      tx.amount = buf.readUInt64(assetOffset / 2).toNumber()
      tx.timelocktype = buf.readInt8(assetOffset / 2 + 8) & 0xff
      tx.timelock = buf.readUInt64(assetOffset / 2 + 9).toNumber()
      tx.recipientId = bs58check.encode(buf.buffer.slice(assetOffset / 2 + 13, assetOffset / 2 + 13 + 21))
      Transaction.parseSignatures(hexString, tx, assetOffset + (21 + 13) * 2)
    } else if (tx.type === TRANSACTION_TYPES.MULTI_PAYMENT) {
      tx.asset = { payments: [] }
      const total = buf.readInt8(assetOffset / 2) & 0xff
      let offset = assetOffset / 2 + 1
      for (let j = 0; j < total; j++) {
        const payment = {}
        payment.amount = buf.readUInt64(offset).toNumber()
        payment.recipientId = bs58check.encode(buf.buffer.slice(offset + 1, offset + 1 + 21))
        tx.asset.payments.push(payment)
        offset += 22
      }
      tx.amount = tx.asset.payments.reduce((a, p) => (a += p.amount), 0)
      Transaction.parseSignatures(hexString, tx, offset * 2)
    } else if (tx.type === TRANSACTION_TYPES.DELEGATE_RESIGNATION) {
      Transaction.parseSignatures(hexString, tx, assetOffset)
    }

    if (!tx.amount) {
      tx.amount = 0
    }

    if (tx.version === 1) {
      if (tx.secondSignature) {
        tx.signSignature = tx.secondSignature
      }

      if (tx.type === TRANSACTION_TYPES.VOTE) {
        tx.recipientId = arkjsv1.crypto.getAddress(tx.senderPublicKey, tx.network)
      }

      // if (tx.type === TRANSACTION_TYPES.VOTE || tx.type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      //   tx.recipientId = arkjsv1.crypto.getAddress(tx.senderPublicKey, tx.network)
      // }

      if (tx.vendorFieldHex) {
        tx.vendorField = Buffer.from(tx.vendorFieldHex, 'hex').toString('utf8')
      }

      if (tx.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
        tx.recipientId = arkjsv1.crypto.getAddress(tx.senderPublicKey, tx.network)
        tx.asset.multisignature.keysgroup = tx.asset.multisignature.keysgroup.map(k => '+' + k)
      }

      if (!tx.id) {
        tx.id = arkjsv1.crypto.getId(tx)
      }
    } else if (tx.version === 2) {
      tx.id = crypto.createHash('sha256').update(Buffer.from(hexString, 'hex')).digest().toString('hex');
    }
    return tx
  }

  // TODO support multisignatures
  static parseSignatures (hexString, tx, startOffset) {
    tx.signature = hexString.substring(startOffset)

    let multioffset = 0
    if (tx.signature.length === 0) {
      delete tx.signature
    } else {
      const length1 = parseInt('0x' + tx.signature.substring(2, 4), 16) + 2
      tx.signature = hexString.substring(startOffset, startOffset + length1 * 2)
      multioffset += length1 * 2
      tx.secondSignature = hexString.substring(startOffset + length1 * 2)

      if (tx.secondSignature.length === 0) {
        delete tx.secondSignature
      } else {
        if (tx.secondSignature.slice(0, 2) === 'ff') { // start of multisign
          delete tx.secondSignature
        } else {
          const length2 = parseInt('0x' + tx.secondSignature.substring(2, 4), 16) + 2
          tx.secondSignature = tx.secondSignature.substring(0, length2 * 2)
          multioffset += length2 * 2
        }
      }
      let signatures = hexString.substring(startOffset + multioffset)
      if (!signatures.length) return
      if (signatures.slice(0, 2) !== 'ff') return
      signatures = signatures.slice(2)
      tx.signatures = []
      for (let i = 0; i < tx.asset.multisignature.keysgroup.length; i++) {
        const mlength = parseInt('0x' + signatures.substring(2, 4), 16) + 2
        if (mlength > 0) tx.signatures.push(signatures.substring(0, mlength * 2))
        signatures = signatures.substring(mlength * 2)
      }
    }
  }
}