'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

/**
 * Get a single block from the database
 * @return {Wallet}
 */
module.exports = (_, args) => {
  return database.wallets.findById(args)
}
