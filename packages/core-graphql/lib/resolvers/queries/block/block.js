'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = (_, { id }) => database.blocks.findById(id)
