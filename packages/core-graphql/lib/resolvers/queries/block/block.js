'use strict';

const database = require('@arkecosystem/core-plugin-manager').get('database')

module.exports = async (_, { id }) => {
  return database.connection.models.block.findById(id)
}
