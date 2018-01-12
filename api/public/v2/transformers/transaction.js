class TransactionTransformer {
  constructor(model) {
    return {
      id: model.id,
      block_id: model.block.id,
      type: model.type,
      amount: model.amount,
      fee: model.fee,
      sender: {
        address: model.sender.address,
        publicKey: model.sender.publicKey,
      },
      recipient: {
        address: model.recipient.address,
        publicKey: model.recipient.publicKey,
      },
      signature: model.signature,
      asset: model.asset,
      confirmations: model.confirmations,
      created_at: model.timestamp,
    };
  }
}

module.exports = TransactionTransformer
