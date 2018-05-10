'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = async (_, { id }) => database.blocks.findById(id)
