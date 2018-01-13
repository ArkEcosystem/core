const arkjs = require('arkjs')
const config = requireFrom('core/config')

class TransactionTransformer {
  constructor (model) {
    return {
      id: model.id,
      block_id: model.blockId,
      type: model.type,
      amount: model.amount,
      fee: model.fee,
      sender: arkjs.crypto.getAddress(model.senderPublicKey, config.network.pubKeyHash),
      recipient: model.recipientId,
      signature: model.signature,
      asset: model.asset,
      confirmations: model.confirmations,
      created_at: model.createdAt
    };
  }
}

module.exports = TransactionTransformer
