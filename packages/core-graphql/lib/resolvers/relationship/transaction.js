'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = {
  block: (transaction) => {
    return database.blocks.findById(transaction.blockId)
  },
  recipient: (transaction) => {
    return transaction.recipientId
      ? database.wallets.findById(transaction.recipientId)
      : []
  },
  sender: (transaction) => {
    return transaction.senderPublicKey
      ? database.wallets.findById(transaction.senderPublicKey)
      : []
  }
}
