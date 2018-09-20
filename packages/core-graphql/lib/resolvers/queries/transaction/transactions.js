'use strict';

const { formatOrderBy } = require('../../../helpers')
const { transactions: repository } = require('../../../repositories')

/**
 * Get multiple transactions from the database
 * @return {Transaction[]}
 */
module.exports = async (root, args) => {
  const { orderBy, filter } = args

  const order = formatOrderBy(orderBy, 'timestamp:desc')

  const result = await repository.findAll({ ...filter, orderBy: order })
  const transactions = result ? result.rows : []
  return transactions
}
