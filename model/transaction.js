const arkjs = require('arkjs')
const bs58check = require('bs58check')
const ByteBuffer = require('bytebuffer')
const config = require('../core/config')

class Transaction {
  constructor (transaction) {
    this.serialized = this.serialize(transaction)
    this.data = Transaction.deserialize(this.serialized.toString('hex'))
    if (this.data.version === 1) {
      this.verified = arkjs.crypto.verify(this.data)
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

  serialize (transaction) {
    const bb = new ByteBuffer(512, true)
    bb.writeByte(0xff) // fill, to disambiguate from v1
    bb.writeByte(transaction.version || 0x01) // version
    bb.writeByte(transaction.network || config.network.pubKeyHash) // ark = 0x17, devnet = 0x30
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
    switch (transaction.type) {
    case 0: // Transfer
      bb.writeUInt64(transaction.amount)
      bb.writeUInt32(transaction.expiration || 0)
      bb.append(bs58check.decode(transaction.recipientId))
      break

    case 1: // Signature
      bb.append(transaction.asset.signature.publicKey, 'hex')
      break

    case 2: // Delegate
      var delegateBytes = new Buffer(transaction.asset.delegate.username, 'utf8')
      bb.writeByte(delegateBytes.length)
      bb.append(delegateBytes, 'hex')
      break

    case 3: // Vote
      var voteBytes = transaction.asset.votes.map(function (vote) {
        return (vote[0] === '+' ? '01' : '00') + vote.slice(1)
      }).join('')
      bb.writeByte(transaction.asset.votes.length)
      bb.append(voteBytes, 'hex')
      break

    case 4: // Multi-Signature
      var keysgroupBuffer = new Buffer(transaction.asset.multisignature.keysgroup.map((k) => k.slice(1)).join(''), 'hex')
      bb.writeByte(transaction.asset.multisignature.min)
      bb.writeByte(transaction.asset.multisignature.keysgroup.length)
      bb.writeByte(transaction.asset.multisignature.lifetime)
      bb.append(keysgroupBuffer, 'hex')
      bb.append(transaction.signatures.join(''), 'hex')
      break

    case 5: // IPFS
      bb.writeByte(transaction.asset.ipfs.dag.length / 2)
      bb.append(transaction.asset.ipfs.dag, 'hex')
      break

    case 6: // timelock transfer
      bb.writeUInt64(transaction.amount)
      bb.writeByte(transaction.timelocktype)
      bb.writeUInt32(transaction.timelock)
      bb.append(bs58check.decode(transaction.recipientId))
      break

    case 7: // multipayment
      bb.writeUInt32(transaction.asset.payments.length)
      transaction.asset.payments.forEach(function (p) {
        bb.writeUInt64(p.amount)
        bb.append(bs58check.decode(p.recipientId))
      })
      break

    case 8: // delegate resignation - empty payload
      break
    }
    if (transaction.signature) bb.append(transaction.signature, 'hex')
    if (transaction.secondSignature) bb.append(transaction.secondSignature, 'hex')
    else if (transaction.signSignature) bb.append(transaction.signSignature, 'hex')
    bb.flip()
    return bb.toBuffer()
  }

  static deserialize (hexString) {
    var tx = {}
    var buf = ByteBuffer.fromHex(hexString, true)
    tx.version = buf.readInt8(1)
    tx.network = buf.readInt8(2)
    tx.type = buf.readInt8(3)
    tx.timestamp = buf.readUInt32(4)
    tx.senderPublicKey = hexString.substring(16, 16 + 33 * 2)
    tx.fee = buf.readUInt64(41).toNumber()
    var vflength = buf.readInt8(41 + 8)
    if (vflength > 0) {
      tx.vendorFieldHex = hexString.substring((41 + 8 + 1) * 2, (41 + 8 + 1) * 2 + vflength * 2)
    }

    var assetOffset = (41 + 8 + 1) * 2 + vflength * 2

    if (tx.type === 0) { // transfer
      tx.amount = buf.readUInt64(assetOffset / 2).toNumber()
      tx.expiration = buf.readUInt32(assetOffset / 2 + 8)
      tx.recipientId = bs58check.encode(buf.buffer.slice(assetOffset / 2 + 12, assetOffset / 2 + 12 + 21))
      Transaction.parseSignatures(hexString, tx, assetOffset + (21 + 12) * 2)
    } else if (tx.type === 1) { // second signature registration
      tx.asset = {
        signature: {
          publicKey: hexString.substring(assetOffset, assetOffset + 66)
        }
      }
      Transaction.parseSignatures(hexString, tx, assetOffset + 66)
    } else if (tx.type === 2) { // delegate registration
      var usernamelength = buf.readInt8(assetOffset / 2) & 0xff

      tx.asset = {
        delegate: {
          username: buf.slice(assetOffset / 2 + 1, assetOffset / 2 + 1 + usernamelength).toString('utf8')
        }
      }
      Transaction.parseSignatures(hexString, tx, assetOffset + (usernamelength + 1) * 2)
    } else if (tx.type === 3) { // vote
      var votelength = buf.readInt8(assetOffset / 2) & 0xff
      tx.asset = {
        votes: []
      }
      var vote
      for (var i = 0; i < votelength; i++) {
        vote = hexString.substring(assetOffset + 2 + i * 2 * 34, assetOffset + 2 + (i + 1) * 2 * 34)
        vote = (vote[1] === '1' ? '+' : '-') + vote.slice(2)
        tx.asset.votes.push(vote)
      }
      Transaction.parseSignatures(hexString, tx, assetOffset + 2 + votelength * 34 * 2)
    } else if (tx.type === 4) { // multisignature creation
      tx.asset = {
        multisignature: {}
      }
      tx.asset.multisignature.min = buf.readInt8(assetOffset / 2) & 0xff
      var num = buf.readInt8(assetOffset / 2 + 1) & 0xff
      tx.asset.multisignature.lifetime = buf.readInt8(assetOffset / 2 + 2) & 0xff
      tx.asset.multisignature.keysgroup = []
      for (var index = 0; index < num; index++) {
        var key = hexString.slice(assetOffset + 6 + index * 66, assetOffset + 6 + (index + 1) * 66)
        tx.asset.multisignature.keysgroup.push(key)
      }
      Transaction.parseSignatures(hexString, tx, assetOffset + 6 + num * 66)
    } else if (tx.type === 5) { // ipfs
      tx.asset = {}
      var l = buf.readInt8(assetOffset / 2) & 0xff
      tx.asset.dag = hexString.substring(assetOffset + 2, assetOffset + 2 + l * 2)
      Transaction.parseSignatures(hexString, tx, assetOffset + 2 + l * 2)
    } else if (tx.type === 6) { // timelock
      tx.amount = buf.readUInt64(assetOffset / 2).toNumber()
      tx.timelocktype = buf.readInt8(assetOffset / 2 + 8) & 0xff
      tx.timelock = buf.readUInt64(assetOffset / 2 + 9).toNumber()
      tx.recipientId = bs58check.encode(buf.buffer.slice(assetOffset / 2 + 13, assetOffset / 2 + 13 + 21))
      Transaction.parseSignatures(hexString, tx, assetOffset + (21 + 13) * 2)
    } else if (tx.type === 7) { // multipayment
      tx.asset = {
        payments: []
      }
      var total = buf.readInt8(assetOffset / 2) & 0xff
      var offset = assetOffset / 2 + 1
      for (var j = 0; j < total; j++) {
        var payment = {}
        payment.amount = buf.readUInt64(offset).toNumber()
        payment.recipientId = bs58check.encode(buf.buffer.slice(offset + 1, offset + 1 + 21))
        tx.asset.payments.push(payment)
        offset += 22
      }
      Transaction.parseSignatures(hexString, tx, offset * 2)
    } else if (tx.type === 8) { // delegate resignation
      Transaction.parseSignatures(hexString, tx, assetOffset)
    }

    if (tx.version === 1) {
      if (!tx.amount) {
        tx.amount = 0
      }
      if (!tx.recipientId && tx.type === 3) {
        tx.recipientId = arkjs.crypto.getAddress(tx.senderPublicKey, tx.network)
      }
      if (tx.vendorFieldHex) {
        tx.vendorField = new Buffer(tx.vendorFieldHex, 'hex').toString('utf8')
      }
      if (tx.type === 4) {
        tx.asset.multisignature.keysgroup = tx.asset.multisignature.keysgroup.map((k) => {
          return '+' + k
        })
      }
      tx.signSignature = tx.secondSignature
      if (!tx.id) {
        tx.id = arkjs.crypto.getId(tx)
      }
    }
    return tx
  }

  static parseSignatures (hexString, tx, startOffset) {
    if (tx.type === 4) {
      let signatures = hexString.substring(startOffset)
      tx.signatures = []
      for (var i = 0; i < tx.asset.multisignature.keysgroup.length; i++) {
        var length = parseInt('0x' + signatures.substring(2, 4), 16) + 2
        tx.signatures.push(signatures.substring(0, length * 2))
        signatures = signatures.substring(length * 2)
        startOffset += length * 2
      }
    }
    tx.signature = hexString.substring(startOffset)
    if (tx.signature.length === 0) delete tx.signature
    else {
      let length = parseInt('0x' + tx.signature.substring(2, 4), 16) + 2
      tx.signature = hexString.substring(startOffset, startOffset + length * 2)
      tx.secondSignature = hexString.substring(startOffset + length * 2)
      if (tx.secondSignature.length === 0) delete tx.secondSignature
    }
  }
}

module.exports = Transaction
