'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy } = require('../../../helpers')

module.exports = async (_, args) => {
  const { limit, orderBy, ...params } = args

  let order = formatOrderBy(orderBy, ['balance', 'DESC'])

  const where = params

  return database.connection.models.wallet.findAll({ limit, order, where })
}
