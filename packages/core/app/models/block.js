const arkjs = require('arkjs')
const crypto = require('crypto')
const bignum = require('bignum')
const ByteBuffer = require('bytebuffer')
const Transaction = require('./transaction')
const config = require('../core/config')

const applyV1Fix = (block) => {
  // START Fix for v1 api
  block.totalAmount = parseInt(block.totalAmount)
  block.totalFee = parseInt(block.totalFee)
  block.reward = parseInt(block.reward)
  // END Fix for v1 api

  // order of transactions messed up in mainnet V1
  // if (block.data.transactions.length === 2 && (block.data.height === 3084276 || block.data.height === 34420)) {
  //   const temp = block.data.transactions[0]
  //   block.data.transactions[0] = block.data.transactions[1]
  //   block.data.transactions[1] = temp
  // }
}

module.exports = class Block {
  constructor (data) {
    this.serialized = Block.serializeFull(data).toString('hex')
    this.data = Block.deserialize(this.serialized)
    // fix on issue of non homogeneus transaction type 1 payloads
    data.transactions.forEach((tx, i) => {
      const thistx = this.data.transactions[i]
      if (thistx.type === 1 && thistx.version === 1 && tx.recipientId) {
        thistx.recipientId = arkjs.crypto.getAddress(thistx.senderPublicKey, thistx.network)
        thistx.id = arkjs.crypto.getId(thistx)
      }
    })

    this.data.id = Block.getId(this.data)

    // fix on real timestamp
    this.transactions = data.transactions.map(tx => {
      let txx = new Transaction(tx)
      txx.blockId = data.id
      txx.timestamp = data.timestamp
      return txx
    })
    if (data.height === 1) {
      this.genesis = true
      // TODO genesis block calculated id is wrong for some reason
      this.data.id = data.id
    }
    this.verification = this.verify()
    if (!this.verification.verified) {
      console.log(data)
      console.log(this.data)
      console.log(this.verification)
    }
  }

  static create (data, keys) {
    const payloadHash = Block.serialize(data)
    const hash = crypto.createHash('sha256').update(payloadHash).digest()
    data.generatorPublicKey = keys.publicKey
    data.blockSignature = keys.sign(hash).toDER().toString('hex')
    data.id = Block.getId(data)
    return new Block(data)
  }

  toString () {
    return `${this.data.id}, height: ${this.data.height}, ${this.data.transactions.length} transactions, verified: ${this.verification.verified}, errors:${this.verification.errors}`
  }

  toBroadcastV1 () {
    return this.data
  }

  static getId (data) {
    const hash = crypto.createHash('sha256').update(Block.serialize(data, true)).digest()
    const temp = Buffer.alloc(8)
    for (let i = 0; i < 8; i++) {
      temp[i] = hash[7 - i]
    }

    return bignum.fromBuffer(temp).toString()
  }

  getHeader () {
    const header = {...{}, ...this.data}
    delete header.transactions
    return header
  }

  verifySignature () {
    // console.log(this.data)
    let bytes = Block.serialize(this.data, false)
    let hash = crypto.createHash('sha256').update(bytes).digest()
    let blockSignatureBuffer = Buffer.from(this.data.blockSignature, 'hex')
    let generatorPublicKeyBuffer = Buffer.from(this.data.generatorPublicKey, 'hex')
    let ecpair = arkjs.ECPair.fromPublicKeyBuffer(generatorPublicKeyBuffer)
    let ecsignature = arkjs.ECSignature.fromDER(blockSignatureBuffer)
    let res = ecpair.verify(hash, ecsignature)

    return res
  }

  verify () {
    let block = this.data
    let result = {
      verified: false,
      errors: []
    }

    const constants = config.getConstants(block.height)

    // let previousBlock = null

    if (block.height !== 1) {
      if (!block.previousBlock) {
        result.errors.push('Invalid previous block')
      }
    }

    if (constants.reward !== block.reward) {
      result.errors.push(['Invalid block reward:', block.reward, 'expected:', constants.reward].join(' '))
    }

    let valid = this.verifySignature(block)

    if (!valid) {
      result.errors.push('Failed to verify block signature')
    }

    if (block.version !== constants.block.version) {
      result.errors.push('Invalid block version')
    }

    if (arkjs.slots.getSlotNumber(block.timestamp) > arkjs.slots.getSlotNumber()) {
      result.errors.push('Invalid block timestamp')
    }

    // Disabling to allow orphanedBlocks?
    // if(previousBlock){
    //   const lastBlockSlotNumber = slots.getSlotNumber(previousBlock.timestamp)
    //   if(blockSlotNumber < lastBlockSlotNumber) {
    //      result.errors.push('block timestamp is smaller than previous block timestamp')
    //   }
    // }

    if (block.payloadLength > constants.maxPayloadLength) {
      result.errors.push('Payload length is too high')
    }

    if (block.transactions.length !== block.numberOfTransactions) {
      result.errors.push('Invalid number of transactions')
    }

    if (block.transactions.length > constants.block.maxTransactions) {
      result.errors.push('Transactions length is too high')
    }

    // Checking if transactions of the block adds up to block values.
    let totalAmount = 0
    let totalFee = 0
    let size = 0
    let payloadHash = crypto.createHash('sha256')
    let appliedTransactions = {}

    block.transactions.forEach((transaction) => {
      const bytes = Buffer.from(transaction.id, 'hex')

      if (appliedTransactions[transaction.id]) {
        result.errors.push('Encountered duplicate transaction: ' + transaction.id)
      }
      appliedTransactions[transaction.id] = transaction

      totalAmount += transaction.amount
      totalFee += transaction.fee
      size += bytes.length

      payloadHash.update(bytes)
    })

    if (size > constants.block.maxPayload) {
      result.errors.push('Payload is too large')
    }

    if (!this.genesis && payloadHash.digest().toString('hex') !== block.payloadHash) {
      result.errors.push('Invalid payload hash')
    }

    if (totalAmount !== block.totalAmount) {
      result.errors.push('Invalid total amount')
    }

    if (totalFee !== block.totalFee) {
      result.errors.push('Invalid total fee')
    }

    result.verified = result.errors.length === 0
    return result
  }

  static deserialize (hexString) {
    const block = {}
    const buf = ByteBuffer.fromHex(hexString, true)
    block.version = buf.readUInt32(0)
    block.timestamp = buf.readUInt32(4)
    block.height = buf.readUInt32(8)
    block.previousBlock = bignum.fromBuffer(buf.slice(12, 20).toBuffer()).toString()
    block.numberOfTransactions = buf.readUInt32(20)
    block.totalAmount = buf.readUInt64(24).toNumber()
    block.totalFee = buf.readUInt64(32).toNumber()
    block.reward = buf.readUInt64(40).toNumber()
    block.payloadLength = buf.readUInt32(48)
    block.payloadHash = hexString.substring(104, 104 + 64)
    block.generatorPublicKey = hexString.substring(104 + 64, 104 + 64 + 33 * 2)
    const length = parseInt('0x' + hexString.substring(104 + 64 + 33 * 2 + 2, 104 + 64 + 33 * 2 + 4), 16) + 2
    block.blockSignature = hexString.substring(104 + 64 + 33 * 2, 104 + 64 + 33 * 2 + length * 2)
    let txoffset = (104 + 64 + 33 * 2 + length * 2) / 2
    block.transactions = []
    for (let i = 0; i < block.numberOfTransactions; i++) {
      block.transactions.push(buf.readUint32(txoffset))
      txoffset += 4
    }
    for (let i = 0; i < block.numberOfTransactions; i++) {
      const ltx = block.transactions[i]
      block.transactions[i] = Transaction.deserialize(buf.slice(txoffset, txoffset + ltx).toString('hex'))
      txoffset += ltx
    }
    return block
  }

  static serializeFull (block) {
    const buf = new ByteBuffer(1024, true)
    applyV1Fix(block)
    buf.append(Block.serialize(block, true))
    const txser = block.transactions.map(tx => Transaction.serialize(tx))
    txser.forEach(tx => buf.writeUInt32(tx.length))
    txser.forEach(tx => buf.append(tx))
    buf.flip()
    return buf.toBuffer()
  }

  static serialize (block, includeSignature) {
    if (includeSignature === undefined) {
      includeSignature = block.blockSignature !== undefined
    }
    let size = 4 + 4 + 4 + 8 + 4 + 4 + 8 + 8 + 4 + 4 + 4 + 32 + 33
    let blockSignatureBuffer = null

    if (includeSignature) {
      blockSignatureBuffer = Buffer.from(block.blockSignature, 'hex')
      size += blockSignatureBuffer.length
    }
    let b, i

    try {
      const bb = new ByteBuffer(size, true)
      bb.writeUInt32(block.version)
      bb.writeUInt32(block.timestamp)
      bb.writeUInt32(block.height)

      if (block.previousBlock) {
        const pb = bignum(block.previousBlock).toBuffer({
          size: '8'
        })

        for (i = 0; i < 8; i++) {
          bb.writeByte(pb[i])
        }
      } else {
        for (i = 0; i < 8; i++) {
          bb.writeByte(0)
        }
      }

      bb.writeUInt32(block.numberOfTransactions)
      bb.writeUInt64(block.totalAmount)
      bb.writeUInt64(block.totalFee)
      bb.writeUInt64(block.reward)

      bb.writeUInt32(block.payloadLength)

      const payloadHashBuffer = Buffer.from(block.payloadHash, 'hex')
      for (i = 0; i < payloadHashBuffer.length; i++) {
        bb.writeByte(payloadHashBuffer[i])
      }

      const generatorPublicKeyBuffer = Buffer.from(block.generatorPublicKey, 'hex')
      for (i = 0; i < generatorPublicKeyBuffer.length; i++) {
        bb.writeByte(generatorPublicKeyBuffer[i])
      }

      if (includeSignature) {
        for (i = 0; i < blockSignatureBuffer.length; i++) {
          bb.writeByte(blockSignatureBuffer[i])
        }
      }

      bb.flip()
      b = bb.toBuffer()
    } catch (e) {
      throw e
    }

    return b
  }
}
