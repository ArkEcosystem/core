'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy, unserializeTransactions } = require('../../helpers')

module.exports = {
  transactions: async (block, args) => {
    const { orderBy, filter, ...params } = args

    const order = formatOrderBy(orderBy, 'timestamp:DESC')
    const result = await database.transactions.findAll({ ...filter, orderBy: order, ...params }, false)

    return unserializeTransactions(result)
  },
  generator: (block) => {
    const generatorPublicKey = block.dataValues.generatorPublicKey
    return database.wallets.findById(generatorPublicKey)
  }
}
