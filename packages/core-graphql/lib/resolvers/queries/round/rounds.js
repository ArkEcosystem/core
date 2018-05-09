'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy } = require('../../../helpers')

module.exports = async (_, args) => {
  const { orderBy, ...params } = args

  let order = formatOrderBy(orderBy, ['id', 'DESC'])

  const result = await database.connection.models.round.findAll({ ...params, order })
  return result
}
