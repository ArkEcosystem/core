const blockchain = require('app/core/blockchainManager').getInstance()
const state = blockchain.getState()

module.exports = async (model) => {
  const lastBlock = state.lastBlock

  return {
    id: model.id,
    version: model.version,
    timestamp: model.timestamp,
    previousBlock: model.previousBlock,
    height: model.height,
    numberOfTransactions: model.numberOfTransactions,
    totalAmount: model.totalAmount,
    totalFee: model.totalFee,
    reward: model.reward,
    payloadLength: model.payloadLength,
    payloadHash: model.payloadHash,
    generatorPublicKey: model.generatorPublicKey,
    blockSignature: model.blockSignature,
    confirmations: lastBlock ? lastBlock.data.height - model.height : 0
  }
}
