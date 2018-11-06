'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

/**
 * Get a single block from the database
 * @return {Block}
 */
module.exports = (_, { id }) => database.db.blocks.findById(id)
