'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy, unserializeTransactions } = require('../../helpers')

module.exports = {
  async transactions (block, args) {
    const { orderBy, filter, ...params } = args

    const result = await database.transactions.findAll({
      ...filter,
      orderBy: formatOrderBy(orderBy, 'timestamp:DESC'),
      ...params
    }, false)

    return unserializeTransactions(result)
  },
  generator (block) {
    const generatorPublicKey = block.dataValues.generatorPublicKey
    return database.wallets.findById(generatorPublicKey)
  }
}
