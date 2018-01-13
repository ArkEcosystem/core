const blockchain = requireFrom('core/blockchainManager')

class BlockTransformer {
  constructor(model) {
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
      confirmations: blockchain.getInstance().lastBlock.data.height - model.height
    }
  }
}

module.exports = BlockTransformer
