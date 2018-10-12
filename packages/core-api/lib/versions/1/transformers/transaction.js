'use strict'

const { crypto } = require('@arkecosystem/crypto')
const { bignumify } = require('@arkecosystem/core-utils')

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
  const data = new Transaction(model.serialized.toString('hex'))

  return {
    id: data.id,
    blockid: model.blockId,
    type: data.type,
    timestamp: data.timestamp,
    amount: +bignumify(data.amount).toFixed(),
    fee: +bignumify(data.fee).toFixed(),
    recipientId: data.recipientId,
    senderId: crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    senderPublicKey: data.senderPublicKey,
    vendorField: data.vendorField,
    signature: data.signature,
    signSignature: data.signSignature,
    signatures: data.signatures,
    asset: data.asset || {},
    confirmations: model.block
      ? blockchain.getLastBlock().data.height - model.block.height
      : 0
  }
}
