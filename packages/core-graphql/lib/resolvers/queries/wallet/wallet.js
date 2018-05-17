'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = (_, args) => {
  return database.wallets.findById(args)
}
