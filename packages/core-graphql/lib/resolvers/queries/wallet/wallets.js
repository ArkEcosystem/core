'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy } = require('../../../helpers')

/**
 * Get multiple wallets from the database
 * @return {Wallet[]}
 */
module.exports = async (_, args) => {
  const { orderBy, filter, ...params } = args

  const order = formatOrderBy(orderBy, 'height:desc')
  const result = filter && filter.vote
    ? await database.wallets.findAllByVote(filter.vote, { orderBy: order, ...params })
    : await database.wallets.findAll({ orderBy: order, ...params })

  return result ? result.rows : []
}
