const arkjs = require('arkjs')
const blockchain = require('app/core/blockchainManager').getInstance()
const state = blockchain.getState()
const config = require('app/core/config')
const Transaction = require('app/models/transaction')

module.exports = (model) => {
  const lastBlock = state.lastBlock
  const data = Transaction.deserialize(model.serialized.toString('hex'))

  return {
    id: data.id,
    block_id: model.blockId,
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
