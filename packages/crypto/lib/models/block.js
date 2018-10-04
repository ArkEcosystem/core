const { cloneDeepWith } = require('lodash')
const { createHash } = require('crypto')
const ByteBuffer = require('bytebuffer')
const Bignum = require('../utils/bignum')
const Transaction = require('./transaction')
const configManager = require('../managers/config')
const { crypto, slots } = require('../crypto')
const { outlookTable } = require('../constants').CONFIGURATIONS.ARK.MAINNET

const toBytesHex = (data) => {
  const temp = data ? new Bignum(data).toString(16) : ''
  return '0'.repeat(16 - temp.length) + temp
}

/**
 * TODO copy some parts to ArkDocs
 * @classdesc This model holds the block data, its verification and serialization
 *
 * A Block model stores on the db:
 *   - id
 *   - version (version of the block: could be used for changing how they are forged)
 *   - timestamp (related to the genesis block)
 *   - previousBlock (id of the previous block)
 *   - height
 *   - numberOfTransactions
 *   - totalAmount (in arktoshi)
 *   - totalFee (in arktoshi)
 *   - reward (in arktoshi)
 *   - payloadHash (hash of the transactions)
 *   - payloadLength (total length in bytes of the IDs of the transactions)
 *   - generatorPublicKey (public key of the delegate that forged this block)
 *   - blockSignature
 *
 * The `transactions` are stored too, but in a different table.
 *
 * These data is exposed through the `data` attributed as a plain object and
 * serialized through the `serialized` attribute.
 *
 * In the future the IDs could be changed to use the hexadecimal version of them,
 * which would be more efficient for performance, disk usage and bandwidth reasons.
 * That is why there are some attributes, such as `idHex` and `previousBlockHex`.
 */
module.exports = class Block {
  /**
   * @constructor
   * @param {Object} data - The data of the block
   */
  constructor (data) {
    if (typeof data === 'string') {
      data = Block.deserialize(data)
    }

    if (!data.transactions) {
      data.transactions = []
    }
    if (data.numberOfTransactions > 0 && data.transactions.length === data.numberOfTransactions) {
      delete data.transactionIds
    }

    this.headerOnly = data.numberOfTransactions > 0 && data.transactionIds && data.transactionIds.length === data.numberOfTransactions
    if (this.headerOnly) {
      this.serialized = Block.serialize(data).toString('hex')
    } else {
      this.serialized = Block.serializeFull(data).toString('hex')
    }
    this.data = Block.deserialize(this.serialized)

    this.data.id = Block.getId(this.data)
    this.data.idHex = Block.getIdHex(this.data)

    if (outlookTable[this.data.id]) {
      this.data.id = outlookTable[this.data.id]
      this.data.idHex = toBytesHex(this.data.id)
    }
    if (data.id !== this.data.id) {
      console.log(`'${this.data.id}': '${data.id}',`)
    }

    if (data.height === 1) {
      this.genesis = true
      // TODO genesis block calculated id is wrong for some reason
      this.data.id = data.id
      this.data.idHex = toBytesHex(this.data.id)
      delete this.data.previousBlock
    }

    // fix on real timestamp, this is overloading transaction timestamp with block timestamp for storage only
    // also add sequence to keep database sequence
    let sequence = 0
    this.transactions = data.transactions.map(transaction => {
      const stampedTransaction = new Transaction(transaction)
      stampedTransaction.blockId = this.data.id
      stampedTransaction.timestamp = this.data.timestamp
      stampedTransaction.sequence = sequence++
      return stampedTransaction
    })

    delete this.data.transactions
    if (data.transactionIds && data.transactionIds.length > 0) {
      this.transactionIds = data.transactionIds
    }

    this.verification = this.verify()

    // order of transactions messed up in mainnet V1
    // TODO: move this to network constants exception using block ids
    if (this.transactions && this.data.numberOfTransactions === 2 && (this.data.height === 3084276 || this.data.height === 34420)) {
      const temp = this.transactions[0]
      this.transactions[0] = this.transactions[1]
      this.transactions[1] = temp
    }

    if (!this.verification.verified && this.data.height !== 1) {
      // console.log(JSON.stringify(data, null, 2))
      console.log(this.serialized)
      console.log(this.verification)
    }
  }

  /**
   * Create block from data.
   * @param  {Object} data
   * @param  {Object} keys
   * @return {Block}
   * @static
   */
  static create (data, keys) {
    data.generatorPublicKey = keys.publicKey

    const payloadHash = Block.serialize(data, false)
    const hash = createHash('sha256').update(payloadHash).digest()

    data.blockSignature = crypto.signHash(hash, keys)
    data.id = Block.getId(data)

    return new Block(data)
  }

  /**
   * Return block as string.
   * @return {String}
   */
  toString () {
    return `${this.data.id}, height: ${this.data.height}, ${this.data.numberOfTransactions} transactions, verified: ${this.verification.verified}, errors:${this.verification.errors}` // eslint-disable-line max-len
  }

  /*
   * Get block id
   * @param  {Object} data
   * @return {String}
   * @static
   */
  static getIdHex (data) {
    const hash = createHash('sha256').update(Block.serialize(data, true)).digest()
    const temp = Buffer.alloc(8)

    for (let i = 0; i < 8; i++) {
      temp[i] = hash[7 - i]
    }
    return temp.toString('hex')
  }

  static getId (data) {
    const idHex = Block.getIdHex(data)
    return new Bignum(idHex, 16).toString()
  }

  /**
   * Get header from block.
   * @return {Object} The block data, without the transactions
   */
  getHeader () {
    const header = Object.assign({}, this.data)
    delete header.transactions
    return header
  }

  /**
   * Verify signature associated with this block.
   * @return {Boolean}
   */
  verifySignature () {
    const bytes = Block.serialize(this.data, false)
    const hash = createHash('sha256').update(bytes).digest()

    return crypto.verifyHash(hash, this.data.blockSignature, this.data.generatorPublicKey)
  }

  /**
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
      const constants = configManager.getConstants(block.height)

      // let previousBlock = null

      if (block.height !== 1) {
        if (!block.previousBlock) {
          result.errors.push('Invalid previous block')
        }
      }

      if (!block.reward.isEqualTo(constants.reward)) {
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

      if (block.payloadLength > constants.maxPayload) {
        result.errors.push('Payload length is too high')
      }

      let size = 0
      let payloadHash = createHash('sha256')

      if (this.headerOnly) {
        if (this.transactionIds.length !== block.numberOfTransactions) {
          result.errors.push('Invalid number of transactions')
        }

        if (this.transactionIds.length > constants.block.maxTransactions) {
          if (block.height > 1) result.errors.push('Transactions length is too high')
        }

        // Checking if transactions of the block adds up to block values.
        let appliedTransactions = {}
        this.transactionIds.forEach(id => {
          const bytes = Buffer.from(id, 'hex')

          if (appliedTransactions[id]) {
            result.errors.push('Encountered duplicate transaction: ' + id)
          }

          appliedTransactions[id] = id
          size += bytes.length

          payloadHash.update(bytes)
        })
      } else {
        const invalidTransactions = this.transactions.filter(tx => !tx.verified)
        if (invalidTransactions.length > 0) {
          result.errors.push('One or more transactions are not verified:')
          invalidTransactions.forEach(tx => result.errors.push('=> ' + tx.serialized))
        }

        if (this.transactions.length !== block.numberOfTransactions) {
          result.errors.push('Invalid number of transactions')
        }

        if (this.transactions.length > constants.block.maxTransactions) {
          if (block.height > 1) result.errors.push('Transactions length is too high')
        }

        // Checking if transactions of the block adds up to block values.
        let appliedTransactions = {}
        let totalAmount = Bignum.ZERO
        let totalFee = Bignum.ZERO
        this.transactions.forEach(transaction => {
          const bytes = Buffer.from(transaction.data.id, 'hex')

          if (appliedTransactions[transaction.data.id]) {
            result.errors.push('Encountered duplicate transaction: ' + transaction.data.id)
          }

          appliedTransactions[transaction.data.id] = transaction.data

          totalAmount = totalAmount.plus(transaction.data.amount)
          totalFee = totalFee.plus(transaction.data.fee)
          size += bytes.length

          payloadHash.update(bytes)
        })

        if (!totalAmount.isEqualTo(block.totalAmount)) {
          result.errors.push('Invalid total amount')
        }

        if (!totalFee.isEqualTo(block.totalFee)) {
          result.errors.push('Invalid total fee')
        }
      }

      if (size > constants.block.maxPayload) {
        result.errors.push('Payload is too large')
      }

      if (!this.genesis && payloadHash.digest().toString('hex') !== block.payloadHash) {
        result.errors.push('Invalid payload hash')
      }
    } catch (error) {
      result.errors.push(error)
    }

    result.verified = result.errors.length === 0

    return result
  }

  /**
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
    block.previousBlock = new Bignum(block.previousBlockHex, 16).toString()
    block.numberOfTransactions = buf.readUInt32(20)
    block.totalAmount = new Bignum(buf.readUInt64(24))
    block.totalFee = new Bignum(buf.readUInt64(32))
    block.reward = new Bignum(buf.readUInt64(40))
    block.payloadLength = buf.readUInt32(48)
    block.payloadHash = hexString.substring(104, 104 + 64)
    block.generatorPublicKey = hexString.substring(104 + 64, 104 + 64 + 33 * 2)

    const length = parseInt('0x' + hexString.substring(104 + 64 + 33 * 2 + 2, 104 + 64 + 33 * 2 + 4), 16) + 2
    block.blockSignature = hexString.substring(104 + 64 + 33 * 2, 104 + 64 + 33 * 2 + length * 2)

    let transactionOffset = (104 + 64 + 33 * 2 + length * 2) / 2
    block.transactions = []
    if (hexString.length === transactionOffset * 2) return block

    for (let i = 0; i < block.numberOfTransactions; i++) {
      block.transactions.push(buf.readUint32(transactionOffset))
      transactionOffset += 4
    }

    for (let i = 0; i < block.numberOfTransactions; i++) {
      const transactionsLength = block.transactions[i]
      block.transactions[i] = Transaction.deserialize(buf.slice(transactionOffset, transactionOffset + transactionsLength).toString('hex'))
      transactionOffset += transactionsLength
    }

    return block
  }

  /**
   * Serialize block.
   * @param  {Object} data
   * @return {Buffer}
   * @static
   */
  static serializeFull (block) {
    const buf = new ByteBuffer(1024, true)
    buf.append(Block.serialize(block, true))

    const serializedTransactions = block.transactions.map(transaction => Transaction.serialize(transaction))
    serializedTransactions.forEach(transaction => buf.writeUInt32(transaction.length))
    serializedTransactions.forEach(transaction => buf.append(transaction))
    buf.flip()

    return buf.toBuffer()
  }

  /**
   * Serialize block
   * TODO split this method between bufferize (as a buffer) and serialize (as hex)
   * @param  {Object} block
   * @param  {(Boolean|undefined)} includeSignature
   * @return {Buffer}
   * @static
   */
  static serialize (block, includeSignature = true) {
    block.previousBlockHex = toBytesHex(block.previousBlock)

    const bb = new ByteBuffer(256, true)
    bb.writeUInt32(block.version)
    bb.writeUInt32(block.timestamp)
    bb.writeUInt32(block.height)
    bb.append(block.previousBlockHex, 'hex')
    bb.writeUInt32(block.numberOfTransactions)
    bb.writeUInt64(+block.totalAmount.toString())
    bb.writeUInt64(+block.totalFee.toString())
    bb.writeUInt64(+block.reward.toString())
    bb.writeUInt32(block.payloadLength)
    bb.append(block.payloadHash, 'hex')
    bb.append(block.generatorPublicKey, 'hex')

    if (includeSignature && block.blockSignature) {
      bb.append(block.blockSignature, 'hex')
    }

    bb.flip()
    return bb.toBuffer()
  }

  static getBytesV1 (block, includeSignature) {
    if (includeSignature === undefined) {
      includeSignature = block.blockSignature !== undefined
    }

    let size = 4 + 4 + 4 + 8 + 4 + 4 + 8 + 8 + 4 + 4 + 4 + 32 + 33
    let blockSignatureBuffer = null

    if (includeSignature) {
      blockSignatureBuffer = Buffer.from(block.blockSignature, 'hex')
      size += blockSignatureBuffer.length
    }

    let b

    try {
      const bb = new ByteBuffer(size, true)
      bb.writeInt(block.version)
      bb.writeInt(block.timestamp)
      bb.writeInt(block.height)

      let i

      if (block.previousBlock) {
        const pb = Buffer.from(new Bignum(block.previousBlock).toString(16), 'hex')

        for (i = 0; i < 8; i++) {
          bb.writeByte(pb[i])
        }
      } else {
        for (i = 0; i < 8; i++) {
          bb.writeByte(0)
        }
      }

      bb.writeInt(block.numberOfTransactions)
      bb.writeLong(+block.totalAmount.toString())
      bb.writeLong(+block.totalFee.toString())
      bb.writeLong(+block.reward.toString())

      bb.writeInt(block.payloadLength)

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

  toJson () {
    // Convert Bignums
    let blockData = cloneDeepWith(this.data, (value, key) => {
      if (['reward', 'totalAmount', 'totalFee'].indexOf(key) !== -1) {
        return value.toNumber()
      }
    })

    return Object.assign(blockData, {
      transactions: this.transactions.map(transaction => transaction.toJson())
    })
  }
}
