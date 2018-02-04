const blockchain = require('app/core/blockchainManager').getInstance()

module.exports = (model) => {
  const lastBlock = blockchain.status.lastBlock

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
