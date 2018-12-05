const { app } = require('@arkecosystem/core-container')

const database = app.resolvePlugin('database')

/**
 * Get a single block from the database
 * @return {Block}
 */
module.exports = (_, { id }) => database.db.blocks.findById(id)
