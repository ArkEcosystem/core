'use strict';

const { crypto } = require('@arkecosystem/client')
const blockchain = require('@arkecosystem/core-plugin-manager').get('blockchain')
const state = blockchain.getState()
const config = require('@arkecosystem/core-plugin-manager').get('config')
const { Transaction } = require('@arkecosystem/client').models
const formatTimestamp = require('./utils/format-timestamp')

/**
 * [description]
 * @param  {[type]} model [description]
 * @return {[type]}       [description]
 */
module.exports = (model) => {
  const data = Transaction.deserialize(model.serialized.toString('hex'))

  return {
    id: data.id,
    blockId: model.blockId,
    type: data.type,
    amount: data.amount,
    fee: data.fee,
    sender: crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    recipient: data.recipientId,
    signature: data.signature,
    vendorField: data.vendorField,
    asset: data.asset,
    confirmations: state.lastBlock ? state.lastBlock.data.height - model.block.height : 0,
    timestamp: formatTimestamp(data.timestamp)
  }
}
