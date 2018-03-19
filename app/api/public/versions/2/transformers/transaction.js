const arkjs = require('arkjs')
const blockchain = require('../../../../../core/managers/blockchain').getInstance()
const state = blockchain.getState()
const config = require('../../../../../core/config')
const Transaction = require('../../../../../models/transaction')

module.exports = (model) => {
  const lastBlock = state.lastBlock
  const data = Transaction.deserialize(model.serialized.toString('hex'))

  return {
    id: data.id,
    blockId: model.blockId,
    type: data.type,
    amount: data.amount,
    timestamp: data.timestamp,
    fee: data.fee,
    sender: arkjs.crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    recipient: data.recipientId,
    signature: data.signature,
    asset: data.asset,
    confirmations: lastBlock ? lastBlock.data.height - model.block.height : 0
  }
}
