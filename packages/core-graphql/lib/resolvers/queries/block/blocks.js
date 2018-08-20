'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy } = require('../../../helpers')

/**
 * Get multiple blocks from the database
 * @return {Block[]}
 */
module.exports = (_, args) => {
  const { orderBy, filter, ...params } = args

  const order = formatOrderBy(orderBy, 'height:DESC')

  return database.blocks.findAll({ ...filter, orderBy: order, ...params }, false)
}
