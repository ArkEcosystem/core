const blockchain = requireFrom('core/blockchainManager')

class BlockTransformer {
  constructor (model) {
    const lastBlock = blockchain.getInstance().lastBlock

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
}

module.exports = BlockTransformer
