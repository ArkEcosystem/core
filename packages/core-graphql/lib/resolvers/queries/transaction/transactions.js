'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { constants } = require('@arkecosystem/client')

module.exports = async (root, args) => {
  const { orderBy, filter, ...params } = args
  if (root && root.dataValues.id) filter.blockId = root.dataValues.id

  let order = []
  orderBy ? order.push([orderBy.field, orderBy.direction]) : order.push(['timestamp', 'DESC'])

  const where = { ...filter }
  if (where.type) where.type = constants.TRANSACTION_TYPES[where.type]

  const result = await database.connection.models.transaction.findAll({ where, ...params, order })
  return result
}
