const block = require('./block/block')
const blocks = require('./block/blocks')
const transaction = require('./transaction/transaction')
const transactions = require('./transaction/transactions')
const wallet = require('./wallet/wallet')
const wallets = require('./wallet/wallets')

/**
 * Queries exposed by our GraphQL schema
 */
module.exports = {
  block,
  blocks,
  transaction,
  transactions,
  wallet,
  wallets,
}
