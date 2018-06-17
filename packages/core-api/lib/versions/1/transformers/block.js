'use strict'

const blockchain = require('@arkecosystem/core-container').resolvePlugin('blockchain')

/**
 * Turns a "block" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  const lastBlock = blockchain.state.lastBlock

  return {
    id: model.id,
    version: model.version,
    timestamp: model.timestamp,
    previousBlock: model.previousBlock,
    height: model.height,
    numberOfTransactions: model.numberOfTransactions,
    totalAmount: Number(model.totalAmount),
    totalForged: (Number(model.reward) + Number(model.totalFee)).toString(),
    totalFee: Number(model.totalFee),
    reward: Number(model.reward),
    payloadLength: model.payloadLength,
    payloadHash: model.payloadHash,
    generatorPublicKey: model.generatorPublicKey,
    blockSignature: model.blockSignature,
    confirmations: lastBlock ? lastBlock.data.height - model.height : 0
  }
}
