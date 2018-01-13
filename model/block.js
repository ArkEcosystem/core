const arkjs = require('arkjs')
const crypto = require('crypto')
const bignum = require('bignum')
const ByteBuffer = require('bytebuffer')
const Transaction = require('./transaction')
const config = require('../core/config')

class Block {
  constructor (data) {
    this.data = data
    this.data.totalAmount = parseInt(this.data.totalAmount)
    this.data.totalFee = parseInt(this.data.totalFee)
    this.data.reward = parseInt(this.data.reward)
    this.genesis = data.height === 1
    this.transactions = data.transactions.map(tx => {
      let txx = new Transaction(tx)
      txx.blockId = data.id
      return txx
    })
    this.verification = this.verify()
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

  static getId (data) {
    const hash = crypto.createHash('sha256').update(Block.serialize(data, true)).digest()
    const temp = Buffer.from(8)
    for (let i = 0; i < 8; i++) {
      temp[i] = hash[7 - i]
    }

    return bignum.fromBuffer(temp).toString()
  }

  getHeader () {
    const header = Object.assign({}, this.data)
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

    // var previousBlock = null

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
    //   var lastBlockSlotNumber = slots.getSlotNumber(previousBlock.timestamp)
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
      var bytes = Buffer.from(transaction.id, 'hex')

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

  static serialize (block, includeSignature) {
    if (includeSignature === undefined) {
      includeSignature = block.blockSignature !== undefined
    }
    var size = 4 + 4 + 4 + 8 + 4 + 4 + 8 + 8 + 4 + 4 + 4 + 32 + 33
    var blockSignatureBuffer = null

    if (includeSignature) {
      blockSignatureBuffer = Buffer.from(block.blockSignature, 'hex')
      size += blockSignatureBuffer.length
    }
    var b, i

    try {
      var bb = new ByteBuffer(size, true)
      bb.writeInt(block.version)
      bb.writeInt(block.timestamp)
      bb.writeInt(block.height)

      if (block.previousBlock) {
        var pb = bignum(block.previousBlock).toBuffer({
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

      bb.writeInt(block.numberOfTransactions)
      bb.writeLong(block.totalAmount)
      bb.writeLong(block.totalFee)
      bb.writeLong(block.reward)

      bb.writeInt(block.payloadLength)

      var payloadHashBuffer = Buffer.from(block.payloadHash, 'hex')
      for (i = 0; i < payloadHashBuffer.length; i++) {
        bb.writeByte(payloadHashBuffer[i])
      }

      var generatorPublicKeyBuffer = Buffer.from(block.generatorPublicKey, 'hex')
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

module.exports = Block
