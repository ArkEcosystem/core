'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy } = require('../../../helpers')

/**
 * Get multiple wallets from the database
 * @return {Wallet[]}
 */
module.exports = async (_, args) => {
  const { orderBy, filter, ...params } = args

  const order = formatOrderBy(orderBy, 'height:DESC')
  const result = await database.wallets.findAll({ ...filter, orderBy: order, ...params })

  return result ? result.rows : []
}
