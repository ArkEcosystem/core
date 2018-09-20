'use strict';

const { formatOrderBy } = require('../../../helpers')
const { blocks: repository } = require('../../../repositories')

/**
 * Get multiple blocks from the database
 * @return {Block[]}
 */
module.exports = async (_, args) => {
  const { orderBy, filter } = args

  const order = formatOrderBy(orderBy, 'height:desc')

  const result = await repository.findAll({ ...filter, orderBy: order })

  return result ? result.rows : []
}
