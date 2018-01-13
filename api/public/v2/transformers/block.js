class BlockTransformer {
  constructor (model) {
    return {
      id: model.id,
      version: model.version,
      height: model.height,
      previous: model.previousBlock,
      forged: {
        reward: model.reward,
        fee: model.totalFee,
        total: model.totalForged
      },
      payload: {
        length: model.payloadLength,
        hash: model.payloadHash
      },
      generator: {
        id: model.generatorId,
        public_key: model.generatorPublicKey
      },
      signature: model.blockSignature,
      confirmations: model.confirmations,
      transactions: model.numberOfTransactions,
      created_at: model.timestamp
    };
  }
}

module.exports = BlockTransformer
