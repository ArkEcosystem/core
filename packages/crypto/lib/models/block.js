const crypto = require('crypto')
const Bignum = require('bigi')
const ByteBuffer = require('bytebuffer')
const secp256k1 = require('secp256k1')
const Transaction = require('./transaction')
const configManager = require('../managers/config')
const slots = require('../crypto/slots')
const { outlookTable } = require('../constants').CONFIGURATIONS.ARK.MAINNET

const toBytesHex = (buffer) => {
  let temp = buffer.toString('hex')
  return '0'.repeat(16 - temp.length) + temp
}

/**
  * Fix to allow blocks to be backwards-compatible.
  * @param {Object} data
  */
const applyV1Fix = (data) => {
  // START Fix for v1 api
  data.totalAmount = parseInt(data.totalAmount)
  data.totalFee = parseInt(data.totalFee)
  data.reward = parseInt(data.reward)
  data.previousBlockHex = data.previousBlock ? toBytesHex(new Bignum(data.previousBlock).toBuffer()) : '0000000000000000'
  data.idHex = toBytesHex(new Bignum(data.id).toBuffer())
  // END Fix for v1 api

  // order of transactions messed up in mainnet V1
  // if (block.data.transactions.length === 2 && (block.data.height === 3084276 || block.data.height === 34420)) {
  //   const temp = block.data.transactions[0]
  //   block.data.transactions[0] = block.data.transactions[1]
  //   block.data.transactions[1] = temp
  // }
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

    this.data.idHex = Block.getIdHex(this.data)
    this.data.id = Block.getId(this.data)

    if (outlookTable[this.data.id]) {
      this.data.id = outlookTable[this.data.id]
      this.data.idHex = toBytesHex(new Bignum(this.data.id).toBuffer())
    }
    if (data.id !== this.data.id) {
      console.log(`'${this.data.id}': '${data.id}',`)
    }

    // if (data.height === 1622706) {
    //   console.log(data)
    //   console.log(this.data)
    // }

    if (data.height === 1) {
      this.genesis = true
      // TODO genesis block calculated id is wrong for some reason
      this.data.id = data.id
      this.data.idHex = toBytesHex(new Bignum(this.data.id).toBuffer())
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

    if (!this.verification.verified && this.data.height !== 1) {
      // console.log(JSON.stringify(data, null, 2))
      console.log(this.serialized)
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

    return new Block(data)
  }

  /*
   * Return block as string.
   * @return {String}
   */
  toString () {
    return `${this.data.id}, height: ${this.data.height}, ${this.data.numberOfTransactions} transactions, verified: ${this.verification.verified}, errors:${this.verification.errors}` // eslint-disable-line max-len
  }

  /*
   * Return block data for v1.
   * @return {Object}
   */
  toBroadcastV1 () {
    return this.toRawJson()
  }

  /*
   * Get block id
   * TODO rename to getIdHex ?
   * @param  {Object} data
   * @return {String}
   * @static
   */
  static getIdHex (data) {
    const hash = crypto.createHash('sha256').update(Block.serialize(data, true)).digest()
    const temp = Buffer.alloc(8)

    for (let i = 0; i < 8; i++) {
      temp[i] = hash[7 - i]
    }
    return temp.toString('hex')
  }

  static getId (data) {
    const hash = crypto.createHash('sha256').update(Block.serialize(data, true)).digest()
    const temp = Buffer.alloc(8)

    for (let i = 0; i < 8; i++) {
      temp[i] = hash[7 - i]
    }
    return Bignum.fromBuffer(temp).toString()
  }

  /*
   * Get header from block.
   * @return {Object} The block data, without the transactions
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
    const bytes = Block.serialize(this.data, false)
    const hash = crypto.createHash('sha256').update(bytes).digest()

    const blockSignatureBuffer = Buffer.from(this.data.blockSignature, 'hex')
    const generatorPublicKeyBuffer = Buffer.from(this.data.generatorPublicKey, 'hex')

    try {
      const signature = secp256k1.signatureImport(blockSignatureBuffer)
      return secp256k1.verify(hash, signature, generatorPublicKeyBuffer)
    } catch (ex) {
      return false
    }
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

      let size = 0
      let payloadHash = crypto.createHash('sha256')

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
        if (!this.transactions.reduce((wallet, transaction) => wallet && transaction.verified, true)) {
          result.errors.push('One or more transactions are not verified')
        }

        if (this.transactions.length !== block.numberOfTransactions) {
          result.errors.push('Invalid number of transactions')
        }

        if (this.transactions.length > constants.block.maxTransactions) {
          if (block.height > 1) result.errors.push('Transactions length is too high')
        }

        // Checking if transactions of the block adds up to block values.
        let appliedTransactions = {}
        let totalAmount = 0
        let totalFee = 0
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

        if (totalAmount !== block.totalAmount) {
          result.errors.push('Invalid total amount')
        }

        if (totalFee !== block.totalFee) {
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

  /*
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

  /*
   * Serialize block
   * TODO split this method between bufferize (as a buffer) and serialize (as hex)
   * @param  {Object} block
   * @param  {(Boolean|undefined)} includeSignature
   * @return {Buffer}
   * @static
   */
  static serialize (block, includeSignature = true) {
    applyV1Fix(block)
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
        const pb = Bignum(block.previousBlock).toBuffer({size: '8'})

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

  toRawJson () {
    return Object.assign(this.data, {
      transactions: this.transactions.map(transaction => transaction.data)
    })
  }
}
