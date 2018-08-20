'use strict'

const container = require('@arkecosystem/core-container')
const {Transaction} = require('@arkecosystem/crypto').models
const {crypto} = require('@arkecosystem/crypto')
const config = container.resolvePlugin('config')
const formatTimestamp = require('./utils/format-timestamp')
// const formatTimestamp = require('./utils/format-timestamp')

/**
 * Turns a "ultranode" object into a generic object.
 * @param  {Object} ultranode
 * @return {Object}
 */
module.exports = (ultraNode) => {
  const data = Transaction.deserialize(ultraNode.serialized.toString('hex'))
  return {
    username: data.asset.delegate.username,
    address: crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    publicKey: data.senderPublicKey,
    type: data.type,
    timestamp: formatTimestamp(data.timestamp)
  }
}
