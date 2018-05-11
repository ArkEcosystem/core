'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = {
  block: (transaction) => database.blocks.findById(transaction.dataValues.blockId),
  recipient: (transaction) => {
    const recipientId = transaction.dataValues.recipientId
    return database.wallets.findById(recipientId)
  },
  sender: (transaction) => {
    const senderPublicKey = transaction.dataValues.recipientId
    return database.wallets.findById(senderPublicKey)
  }
}
