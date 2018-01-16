const Transaction = requireFrom('model/transaction')
const blockchain = requireFrom('core/blockchainManager')

class TransactionTransformer {
  constructor (model) {
    const lastBlock = blockchain.getInstance().lastBlock
    const data = Transaction.deserialize(model.serialized.toString('hex'))

    return {
      id: data.id,
      blockid: data.blockId,
      type: data.type,
      timestamp: data.timestamp,
      amount: data.amount,
      fee: data.fee,
      senderId: data.senderId,
      recipientId: data.recepientId,
      senderPublicKey: data.senderPublicKey,
      signature: data.signature,
      asset: data.asset,
      confirmations: lastBlock ? lastBlock.data.height - model.block.height : 0
    }
  }
}

module.exports = TransactionTransformer
