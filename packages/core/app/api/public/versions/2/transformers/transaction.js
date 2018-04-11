const arkjs = require('arkjs')
const blockchain = require('../../../../../core/managers/blockchain').getInstance()
const state = blockchain.getState()
const config = require('../../../../../core/config')
const Transaction = require('../../../../../models/transaction')
const formatTimestamp = require('../../../../../utils/format-timestamp')

module.exports = (model) => {
  const data = Transaction.deserialize(model.serialized.toString('hex'))

  return {
    id: data.id,
    blockId: model.blockId,
    type: data.type,
    amount: data.amount,
    fee: data.fee,
    sender: arkjs.crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    recipient: data.recipientId,
    signature: data.signature,
    vendorField: data.vendorField,
    asset: data.asset,
    confirmations: state.lastBlock ? state.lastBlock.data.height - model.block.height : 0,
    timestamp: {
      epoch: data.timestamp,
      unix: formatTimestamp(data.timestamp).unix(),
      human: formatTimestamp(data.timestamp).format()
    }
  }
}
