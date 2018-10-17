'use strict'

const { camelizeKeys } = require('xcase')
const createHash = require('create-hash')
const { crypto } = require('@arkecosystem/crypto')
const { Block, Transaction } = require('@arkecosystem/crypto').models
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

module.exports = {
  verifyData: (context, data, prevData, skipVerifySignature) => {
    const verifyTransaction = (data, skipVerifySignature) => {
      if (skipVerifySignature) {
        return true
      }

      const transaction = new Transaction(Buffer.from(data.serialized).toString('hex'))
      return transaction.verified
    }

    const isBlockChained = (data, prevData) => {
      if (data.height === 1) {
        return true
      }
      return (data.height - prevData.height === 1) && (data.previous_block === prevData.id)
    }

    const verifyBlock = (data, prevData, skipVerifySignature) => {
      if (!isBlockChained(data, prevData)) {
        logger.error(`Blocks are not chained. Current block: ${data}, previous block: ${prevData}`)
        return false
      }

      if (!skipVerifySignature) {
        const bytes = Block.serialize(camelizeKeys(data), false)
        const hash = createHash('sha256').update(bytes).digest()

        const signatureVerify = crypto.verifyHash(hash, data.block_signature, data.generator_public_key)
        if (!signatureVerify) {
          logger.error(`Failed to verify signature: ${JSON.stringify(data)}`)
        }
        return signatureVerify
      }

      return true
    }

    switch (context) {
      case 'blocks':
        return verifyBlock(data, prevData, skipVerifySignature)
      case 'transactions':
        return verifyTransaction(data, skipVerifySignature)
      default:
        return false
    }
  },

  canImportRecord: (context, data, lastBlock) => {
    if (!lastBlock) {
      return true
    }
    switch (context) {
      case 'blocks':
        return data.height > lastBlock.height
      case 'transactions':
        return data.timestamp > lastBlock.timestamp
      default:
        return false
    }
  }
}
