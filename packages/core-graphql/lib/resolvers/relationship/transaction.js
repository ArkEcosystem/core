'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = {
  block: async (transaction) => {
    const result = await database.connection.models.block.findById(transaction.dataValues.blockId)
    return result
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
