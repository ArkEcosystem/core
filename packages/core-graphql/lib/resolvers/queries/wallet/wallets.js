'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = async (_, args) => {
  const { limit, orderBy, ...params } = args

  let order = []
  orderBy ? order.push([orderBy.field, orderBy.direction]) : order.push(['balance', 'DESC'])

  const where = params

  return database.connection.models.wallet.findAll({ limit, order, where })
}
