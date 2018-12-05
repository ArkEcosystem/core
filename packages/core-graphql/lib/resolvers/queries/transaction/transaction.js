const { app } = require('@arkecosystem/core-container')

const database = app.resolvePlugin('database')

/**
 * Get a single transaction from the database
 * @return {Transaction}
 */
module.exports = async (_, { id }) => database.db.transactions.findById(id)
