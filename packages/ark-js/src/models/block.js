import crypto from 'crypto'
import bignum from 'bignum'
import ByteBuffer from 'bytebuffer'
import Transaction from '@/models/transaction'
import configManager from '@/managers/config'
import ECPair from '@/crypto/ecpair'
import ECSignature from '@/crypto/ecsignature'
import slots from '@/crypto/slots'

/**
  * [description]
  * @param  {[type]} data [description]
  * @return {[type]}      [description]
  */
const applyV1Fix = data => {
  // START Fix for v1 api
  data.totalAmount = parseInt(data.totalAmount)
  data.totalFee = parseInt(data.totalFee)
  data.reward = parseInt(data.reward)
  // END Fix for v1 api

  // order of transactions messed up in mainnet V1
  if (data.transactions.length === 2 && (data.height === 3084276 || data.height === 34420)) {
    const temp = data.transactions[0]
    data.transactions[0] = data.transactions[1]
    data.transactions[1] = temp
  }
}

export default class Block {
  /**
   * @constructor
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  constructor (data) {
    applyV1Fix(data)

    this.data = data
    this.genesis = data.height === 1
    this.transactions = data.transactions.map(tx => {
      let txx = new Transaction(tx)
      txx.blockId = data.id
      txx.timestamp = data.timestamp
      return txx
    })
    this.verification = this.verify()
  }

  /**
   * [create description]
   * @param  {[type]} data [description]
   * @param  {[type]} keys [description]
   * @return {[type]}      [description]
   */
  static create (data, keys) {
    const payloadHash = Block.serialise(data)
    const hash = crypto.createHash('sha256').update(payloadHash).digest()
    data.generatorPublicKey = keys.publicKey
    data.blockSignature = keys.sign(hash).toDER().toString('hex')
    data.id = Block.getId(data)
    return new Block(data)
  }

  /**
   * [getId description]
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  static getId (data) {
    const hash = crypto.createHash('sha256').update(Block.serialise(data, true)).digest()
    const temp = Buffer.alloc(8)
    for (let i = 0; i < 8; i++) {
      temp[i] = hash[7 - i]
    }

    return bignum.fromBuffer(temp).toString()
  }

  /**
   * [getHeader description]
   * @return {[type]} [description]
   */
  getHeader () {
    const header = {...{}, ...this.data}
    delete header.transactions
    return header
  }

  /**
   * [verifySignature description]
   * @return {[type]} [description]
   */
  verifySignature () {
    let bytes = Block.serialise(this.data, false)
    let hash = crypto.createHash('sha256').update(bytes).digest()
    let blockSignatureBuffer = Buffer.from(this.data.blockSignature, 'hex')
    let generatorPublicKeyBuffer = Buffer.from(this.data.generatorPublicKey, 'hex')
    let ecpair = ECPair.fromPublicKeyBuffer(generatorPublicKeyBuffer)
    let ecsignature = ECSignature.fromDER(blockSignatureBuffer)
    let res = ecpair.verify(hash, ecsignature)

    return res
  }

  /**
   * [verify description]
   * @return {[type]} [description]
   */
  verify () {
    let block = this.data
    let result = {
      verified: false,
      errors: []
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

  /**
   * [serialise description]
   * @param  {[type]} block            [description]
   * @param  {[type]} includeSignature [description]
   * @return {[type]}                  [description]
   */
  static serialise (block, includeSignature) {
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
      bb.writeInt(block.version)
      bb.writeInt(block.timestamp)
      bb.writeInt(block.height)

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

  /**
   * [toString description]
   * @return {[type]} [description]
   */
  toString () {
    return `${this.data.id}, height: ${this.data.height}, ${this.data.transactions.length} transactions, verified: ${this.verification.verified}, errors:${this.verification.errors}` // eslint-disable-line max-len
  }
}
