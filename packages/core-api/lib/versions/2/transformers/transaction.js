'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')

const { crypto } = require('@arkecosystem/crypto')
const { Transaction } = require('@arkecosystem/crypto').models

const formatTimestamp = require('./utils/format-timestamp')

/**
 * Turns a "transaction" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  const data = new Transaction(model.serialized.toString('hex'))
  const lastBlock = blockchain.getLastBlock()

  return {
    id: data.id,
    blockId: model.blockId,
    type: data.type,
    amount: +data.amount.toString(),
    fee: +data.fee.toString(),
    sender: crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    recipient: data.recipientId,
    signature: data.signature,
    signSignature: data.signSignature,
    signatures: data.signatures,
    vendorField: data.vendorField,
    asset: data.asset,
    confirmations: model.block ? lastBlock.data.height - model.block.height : 0,
    timestamp: formatTimestamp(data.timestamp)
  }
}
