'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

/**
 * Get a single transaction from the database
 * @return {Transaction}
 */
module.exports = (_, { id }) => database.transactions.findById(id)
