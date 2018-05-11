'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')

module.exports = (_, args) => {
  const id = args.address || args.publicKey || args.username
  return database.wallets.findById(id)
}
