'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

/**
 * Get a single wallet from the database
 * @return {Wallet}
 */
module.exports = (_, args) => {
  return database.wallets.findById(args)
}
