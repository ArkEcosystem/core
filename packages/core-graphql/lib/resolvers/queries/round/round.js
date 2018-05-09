'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = async (_, { id }) => {
  return database.connection.models.round.findById(id)
}
