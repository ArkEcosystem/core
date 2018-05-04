'use strict'

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const blockchain = pluginManager.get('blockchain')

const client = require('@arkecosystem/client')
const { crypto } = client
const { Transaction } = client.models

const formatTimestamp = require('./utils/format-timestamp')

/**
 * Turns a "transaction" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  const data = Transaction.deserialize(model.serialized.toString('hex'))
  const lastBlock = blockchain.getLastBlock(true)

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
    confirmations: lastBlock ? lastBlock.height - model.block.height : 0,
    timestamp: formatTimestamp(data.timestamp)
  }
}
