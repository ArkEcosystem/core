'use strict'
const container = require('@arkecosystem/core-container')
const bs58check = require('bs58check')
const { configManager } = require('@arkecosystem/crypto')
const logger = container.resolvePlugin('logger')

/**
 * Checks if transaction recipient is on the same network as blockchain
 * @param {Transaction}
 * @return {Boolean}
 */
module.exports = (transaction) => {
  const recipientPrefix = bs58check.decode(transaction.recipientId).readUInt8(0)

  if (recipientPrefix === configManager.get('pubKeyHash')) {
    return true
  }

  logger.error(`Recipient ${transaction.recipientId} is not on the same network: ${configManager.get('pubKeyHash')}`)

  return false
}
