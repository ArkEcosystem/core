'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { constants } = require('@arkecosystem/client')
const { formatOrderBy } = require('../../../helpers')

module.exports = async (root, args) => {
  const { orderBy, filter, ...params } = args
  if (root && root.dataValues.id) filter.blockId = root.dataValues.id

  const order = formatOrderBy(orderBy, ['timestamp', 'DESC'])

  const where = { ...filter }
  if (where.type) where.type = constants.TRANSACTION_TYPES[where.type]

  const result = await database.connection.models.transaction.findAll({ where, ...params, order })
  return result
}
