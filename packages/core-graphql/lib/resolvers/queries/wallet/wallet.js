'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

/**
 * Get a single wallet from the database
 * @return {Wallet}
 */
module.exports = async (_, args) => {
  const param = args.address || args.publicKey || args.username
  return database.wallets.findById(param)
}
