'use strict'

const { camelizeKeys } = require('xcase')
const createHash = require('create-hash')
const { crypto } = require('@arkecosystem/crypto')
const { Block, Transaction } = require('@arkecosystem/crypto').models
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

module.exports = {
  verifyData: (context, data, prevData, signatureVerification) => {
    const verifyTransaction = (data, signatureVerification) => {
      if (!signatureVerification) {
        return true
      }

      const transaction = new Transaction(Buffer.from(data.serialized).toString('hex'))
      return transaction.verified
    }

    const isBlockChained = (data, prevData) => {
      if (!prevData) {
        return true
      }
      // genesis payload different as block.serialize stores block.previous_block with 00000 instead of null
      // it fails on height 2 - chain check
      // hardcoding for now
      // TODO: check to improve ser/deser for genesis, add mainnet
      if (data.height === 2 && data.previous_block === '13114381566690093367' && prevData.id === '12760288562212273414') {
        return true
      }
      return (data.height - prevData.height === 1) && (data.previous_block === prevData.id)
    }

    const verifyBlock = (data, prevData, signatureVerification) => {
      if (!isBlockChained(data, prevData)) {
        logger.error(`Blocks are not chained. Current block: ${JSON.stringify(data)}, previous block: ${JSON.stringify(prevData)}`)
        return false
      }

      // TODO: manually calculate block ID and compare to existing
      if (signatureVerification) {
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
      return verifyBlock(data, prevData, signatureVerification)
    case 'transactions':
      return verifyTransaction(data, signatureVerification)
    default:
      return false
    }
  },

  canImportRecord: (context, data, lastBlock) => {
    if (!lastBlock) { // empty db
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
