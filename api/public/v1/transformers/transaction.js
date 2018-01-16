const Transaction = requireFrom('model/transaction')
const blockchain = requireFrom('core/blockchainManager')

class TransactionTransformer {
  constructor (model) {
    this.data = Transaction.deserialize(model.serialized.toString('hex'))
    return {
      id: this.data.id,
      blockid: this.data.blockId,
      type: this.data.type,
      timestamp: this.data.timestamp,
      amount: this.data.amount,
      fee: this.data.fee,
      senderId: this.data.senderId,
      recipientId: this.data.recepientId,
      senderPublicKey: this.data.senderPublicKey,
      signature: this.data.signature,
      asset: this.data.asset,
      confirmations: blockchain.getInstance().lastBlock.data.height - model.block.height
    }
  }
}

module.exports = TransactionTransformer
