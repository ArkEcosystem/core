'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = {
  block: (transaction) => database.blocks.findById(transaction.blockId),
  recipient: (transaction) => {
    const recipientId = transaction.recipientId
    if (!recipientId) return []

    return database.wallets.findById(recipientId)
  },
  sender: (transaction) => {
    const senderPublicKey = transaction.senderPublicKey
    if (!senderPublicKey) return []

    return database.wallets.findById(senderPublicKey)
  }
}
