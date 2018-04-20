const blocks = require('./blocks')
const delegates = require('./delegates')
const node = require('./node')
const peers = require('./peers')
const statistics = require('./statistics')
const transactions = require('./transactions')
const votes = require('./votes')
const wallets = require('./wallets')
const webhooks = require('./webhooks')

module.exports = {
  blocks,
  delegates,
  node,
  peers,
  statistics,
  transactions,
  votes,
  wallets,
  webhooks
}
