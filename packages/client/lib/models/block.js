const crypto = require('crypto')
const Bignum = require('bignum')
const ByteBuffer = require('bytebuffer')
const Transaction = require('./transaction')
const configManager = require('../managers/config')
const slots = require('../crypto/slots')
const ECPair = require('../crypto/ecpair')
const ECSignature = require('../crypto/ecsignature')

/**
  * Fix to allow blocks to be backwards-compatible.
  * @param {Object} data
  */
const applyV1Fix = (data) => {
  // START Fix for v1 api
  data.totalAmount = parseInt(data.totalAmount)
  data.totalFee = parseInt(data.totalFee)
  data.reward = parseInt(data.reward)
  data.previousBlockHex = data.previousBlock ? new Bignum(data.previousBlock).toBuffer({size: 8}).toString('hex') : '0000000000000000'
  data.idHex = new Bignum(data.id).toBuffer({size: 8}).toString('hex')
  // END Fix for v1 api

  // order of transactions messed up in mainnet V1
  // if (block.data.transactions.length === 2 && (block.data.height === 3084276 || block.data.height === 34420)) {
  //   const temp = block.data.transactions[0]
  //   block.data.transactions[0] = block.data.transactions[1]
  //   block.data.transactions[1] = temp
  // }
}

module.exports = class Block {
  /*
   * @constructor
   */
  constructor (data) {
    if (!data.transactions) data.transactions = []
    this.serialized = Block.serializeFull(data).toString('hex')
    this.data = Block.deserialize(this.serialized)

    this.data.idHex = Block.getId(this.data)
    this.data.id = Bignum(this.data.idHex, 16).toString()

    if (data.height === 1) {
      this.genesis = true
      // TODO genesis block calculated id is wrong for some reason
      this.data.id = data.id
      this.data.idHex = new Bignum(this.data.id).toBuffer({size: 8}).toString('hex')
      delete this.data.previousBlock
    }

    // fix on real timestamp, this is overloading tx timestamp with block timestamp for storage only
    this.transactions = data.transactions.map(tx => {
      const txx = new Transaction(tx)
      txx.blockId = this.data.id
      txx.timestamp = this.data.timestamp
      return txx
    })

    delete this.data.transactions

    this.verification = this.verify()
    if (!this.verification.verified && this.data.height !== 1) {
      console.log(JSON.stringify(this.toRawJson(), null, 2))
      console.log(JSON.stringify(data, null, 2))
      console.log(this.verification)
    }
  }

  /*
   * Create block from data.
   * @param  {Object} data
   * @param  {ECPair}} keys
   * @return {Block}
   * @static
   */
  static create (data, keys) {
    data.generatorPublicKey = keys.publicKey
    const payloadHash = Block.serialize(data, false)
    const hash = crypto.createHash('sha256').update(payloadHash).digest()
    data.blockSignature = keys.sign(hash).toDER().toString('hex')
    data.id = Block.getId(data)
    const block = new Block(data)
    return block
  }

  /*
   * Return block as string.
   * @return {String}
   */
  toString () {
    return `${this.data.id}, height: ${this.data.height}, ${this.data.transactions.length} transactions, verified: ${this.verification.verified}, errors:${this.verification.errors}` // eslint-disable-line max-len
  }

  /*
   * [description]
   * @return {Object}
   */
  toBroadcastV1 () {
    return this.data
  }

  /*
   * Get block id
   * @param  {Object} data
   * @return {String}
   * @static
   */
  static getId (data) {
    const hash = crypto.createHash('sha256').update(Block.serialize(data, true)).digest()
    const temp = Buffer.alloc(8)
    for (let i = 0; i < 8; i++) {
      temp[i] = hash[7 - i]
    }

    return temp.toString('hex')
  }

  /*
   * Get header from block.
   * @return {Object}
   */
  getHeader () {
    const header = this.data
    delete header.transactions
    return header
  }

  /*
   * Verify signature associated with this block.
   * @return {Boolean}
   */
  verifySignature () {
    // console.log(this.data)
    const bytes = Block.serialize(this.data, false)
    const hash = crypto.createHash('sha256').update(bytes).digest()
    const blockSignatureBuffer = Buffer.from(this.data.blockSignature, 'hex')
    const generatorPublicKeyBuffer = Buffer.from(this.data.generatorPublicKey, 'hex')
    const ecpair = ECPair.fromPublicKeyBuffer(generatorPublicKeyBuffer)
    const ecsignature = ECSignature.fromDER(blockSignatureBuffer)
    const res = ecpair.verify(hash, ecsignature)

    return res
  }

  /*
   * Verify this block.
   * @return {Object}
   */
  verify () {
    const block = this.data
    const result = {
      verified: false,
      errors: []
    }
    try {
      if (!this.transactions.reduce((acc, tx) => acc && tx.verified, true)) {
        result.errors.push('One or more transactions are not verified')
      }

      const constants = configManager.getConstants(block.height)

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

      if (slots.getSlotNumber(block.timestamp) > slots.getSlotNumber()) {
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

      if (this.transactions.length !== block.numberOfTransactions) {
        result.errors.push('Invalid number of transactions')
      }

      if (this.transactions.length > constants.block.maxTransactions) {
        if (block.height > 1) result.errors.push('Transactions length is too high')
      }

      // Checking if transactions of the block adds up to block values.
      let totalAmount = 0
      let totalFee = 0
      let size = 0
      let payloadHash = crypto.createHash('sha256')
      let appliedTransactions = {}
      // console.log(block.transactions)
      this.transactions.forEach(transaction => {
        const bytes = Buffer.from(transaction.data.id, 'hex')

        if (appliedTransactions[transaction.data.id]) {
          result.errors.push('Encountered duplicate transaction: ' + transaction.data.id)
        }
        appliedTransactions[transaction.data.id] = transaction.data

        totalAmount += transaction.data.amount
        totalFee += transaction.data.fee
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
    } catch (error) {
      result.errors.push(error)
    }
    result.verified = result.errors.length === 0
    return result
  }

  /*
   * Deserialize block from hex string.
   * @param  {String} hexString
   * @return {Object}
   * @static
   */
  static deserialize (hexString) {
    const block = {}
    const buf = ByteBuffer.fromHex(hexString, true)
    block.version = buf.readUInt32(0)
    block.timestamp = buf.readUInt32(4)
    block.height = buf.readUInt32(8)
    block.previousBlockHex = buf.slice(12, 20).toString('hex')
    block.previousBlock = Bignum(block.previousBlockHex, 16).toString()
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

  /*
   * Serialize block.
   * @param  {Object} data
   * @return {Buffer}
   * @static
   */
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

  /*
   * Serialize block
   * @param  {Object} block
   * @param  {(Boolean|undefined)} includeSignature
   * @return {Buffer}
   * @static
   */
  static serialize (block, includeSignature) {
    if (includeSignature === undefined) {
      includeSignature = block.blockSignature !== undefined
    }

    const bb = new ByteBuffer(256, true)
    bb.writeUInt32(block.version)
    bb.writeUInt32(block.timestamp)
    bb.writeUInt32(block.height)

    // TODO: previousBlock can stay as 8byte hex, it will be simple to process
    if (block.previousBlockHex) {
      bb.append(block.previousBlockHex, 'hex')
    } else {
      bb.append('0000000000000000', 'hex')
    }

    bb.writeUInt32(block.numberOfTransactions)
    bb.writeUInt64(block.totalAmount)
    bb.writeUInt64(block.totalFee)
    bb.writeUInt64(block.reward)
    bb.writeUInt32(block.payloadLength)
    bb.append(block.payloadHash, 'hex')
    bb.append(block.generatorPublicKey, 'hex')
    if (includeSignature) bb.append(block.blockSignature, 'hex')

    bb.flip()
    return bb.toBuffer()
  }

  static getBytesV1 (block, includeSignature) {
    if (includeSignature === undefined) {
      includeSignature = block.blockSignature !== undefined
    }
    var size = 4 + 4 + 4 + 8 + 4 + 4 + 8 + 8 + 4 + 4 + 4 + 32 + 33
    var blockSignatureBuffer = null

    if (includeSignature) {
      blockSignatureBuffer = new Buffer(block.blockSignature, 'hex')
      size += blockSignatureBuffer.length
    }
    var b, i

    try {
      var bb = new ByteBuffer(size, true)
      bb.writeInt(block.version)
      bb.writeInt(block.timestamp)
      bb.writeInt(block.height)

      if (block.previousBlock) {
        var pb = Bignum(block.previousBlock).toBuffer({size: '8'})

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

      var payloadHashBuffer = new Buffer(block.payloadHash, 'hex')
      for (i = 0; i < payloadHashBuffer.length; i++) {
        bb.writeByte(payloadHashBuffer[i])
      }

      var generatorPublicKeyBuffer = new Buffer(block.generatorPublicKey, 'hex')
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

  toRawJson () {
    return {...this.data, transactions: this.transactions.map(tx => tx.data)}
  }
}
