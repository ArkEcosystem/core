'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

/**
 * Get a single transaction from the database
 * @return {Transaction}
 */
module.exports = async (_, { id }) => database.db.transactions.findById(id)
