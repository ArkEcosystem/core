'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = {
  block: (transaction) => {
    return database.blocks.findById(transaction.dataValues.blockId)
  },
  recipient: async (transaction) => {
    const recipientId = transaction.dataValues.recipientId
    const result = await database.connection.models.wallet.findOne({ where: { recipientId } })
    return result
  },
  sender: async (transaction) => {
    const senderPublicKey = transaction.dataValues.recipientId
    const result = await database.connection.models.wallet.findOne({ where: { senderPublicKey } })
    return result
  }
}
