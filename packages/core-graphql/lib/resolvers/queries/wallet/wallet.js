'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = async (_, args) => {
  return database.connection.models.wallet.findOne({ where: { ...args } })
}
