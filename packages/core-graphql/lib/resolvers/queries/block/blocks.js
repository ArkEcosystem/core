'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = async (_, args) => {
  const { orderBy, ...params } = args

  let order = []
  orderBy ? order.push([orderBy.field, orderBy.direction]) : order.push(['height', 'DESC'])

  const result = await database.connection.models.block.findAll({ ...params, order })
  return result
}
