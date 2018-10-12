'use strict'

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatTimestamp, bignumify } = require('@arkecosystem/core-utils')

/**
 * Turns a "block" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = model => {
  const generator = database.walletManager.findByPublicKey(model.generatorPublicKey)

  return {
    id: model.id,
    version: +model.version,
    height: +model.height,
    previous: model.previousBlock,
    forged: {
      reward: +bignumify(model.reward).toFixed(),
      fee: +bignumify(model.totalFee).toFixed(),
      total: +bignumify(model.reward).plus(model.totalFee).toFixed()
    },
    payload: {
      hash: model.payloadHash,
      length: model.payloadLength
    },
    generator: {
      username: generator.username,
      address: generator.address,
      publicKey: generator.publicKey
    },
    signature: model.blockSignature,
    confirmations: model.confirmations,
    transactions: model.numberOfTransactions,
    timestamp: formatTimestamp(model.timestamp)
  }
}
