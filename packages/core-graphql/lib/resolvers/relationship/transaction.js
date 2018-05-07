'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = {
  block: async (transaction) => {
    const result = await database.connection.models.block.findById(transaction.dataValues.blockId)
    return result
  }
}
