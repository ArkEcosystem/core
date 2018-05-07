'use strict';

const database = require('@arkecosystem/core-plugin-manager').get('database')

module.exports = {
  block: async (transaction) => {
    const result = await database.connection.models.block.findById(transaction.dataValues.blockId)
    return result
  }
}
