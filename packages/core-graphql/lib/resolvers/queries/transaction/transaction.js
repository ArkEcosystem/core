'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { unserializeTransactions } = require('../../../helpers')

/**
 * Get a single transaction from the database
 * @return {Transaction}
 */
module.exports = async (_, { id }) => {
  const result = await database.transactions.findById(id)
  const transaction = unserializeTransactions(result.serialized)

  return transaction
}
