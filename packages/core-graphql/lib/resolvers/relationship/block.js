'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const queryTransactions = require('../queries/transaction/transactions')

module.exports = {
  transactions: queryTransactions,
  generator: async (block) => {
    const generatorPublicKey = block.dataValues.generatorPublicKey
    const result = await database.connection.models.wallet.findOne({ where: { publicKey: generatorPublicKey } })
    return result
  }
}
