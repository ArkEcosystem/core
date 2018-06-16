'use strict'

const { crypto } = require('@arkecosystem/crypto')

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')

const { Transaction } = require('@arkecosystem/crypto').models

/**
 * Turns a "transaction" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  const lastBlock = blockchain.getLastBlock()
  const data = Transaction.deserialize(model.serialized.toString('hex'))

  return {
    id: data.id,
    blockid: model.blockId,
    type: data.type,
    timestamp: data.timestamp,
    amount: data.amount,
    fee: data.fee,
    recipientId: data.recipientId,
    senderId: crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    senderPublicKey: data.senderPublicKey,
    vendorField: data.vendorField,
    signature: data.signature,
    asset: data.asset || {},
    confirmations: model.block ? lastBlock.data.height - model.block.height : 0
  }
}
