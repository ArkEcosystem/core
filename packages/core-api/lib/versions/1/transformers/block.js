'use strict'

const { bignumify } = require('@arkecosystem/core-utils')
const blockchain = require('@arkecosystem/core-container').resolvePlugin('blockchain')

/**
 * Turns a "block" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  const lastBlock = blockchain.getLastBlock()

  return {
    id: model.id,
    version: model.version,
    timestamp: model.timestamp,
    previousBlock: model.previousBlock,
    height: model.height,
    numberOfTransactions: model.numberOfTransactions,
    totalAmount: +bignumify(model.totalAmount).toFixed(),
    totalForged: +bignumify(model.reward).plus(model.totalFee).toString(),
    totalFee: +bignumify(model.totalFee).toFixed(),
    reward: +bignumify(model.reward).toFixed(),
    payloadLength: model.payloadLength,
    payloadHash: model.payloadHash,
    generatorPublicKey: model.generatorPublicKey,
    blockSignature: model.blockSignature,
    confirmations: lastBlock ? lastBlock.data.height - model.height : 0
  }
}
