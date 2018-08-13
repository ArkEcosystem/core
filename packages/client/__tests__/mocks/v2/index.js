const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const Blocks = require('./blocks')
const Delegates = require('./delegates')
const Node = require('./node')
const Peers = require('./peers')
const Statistics = require('./statistics')
const Transactions = require('./transactions')
const Votes = require('./votes')
const Wallets = require('./wallets')
const Webhooks = require('./webhooks')

module.exports = config => {
  const mock = new MockAdapter(axios)
  const { host } = config

  Blocks(mock, host)
  Delegates(mock, host)
  Node(mock, host)
  Peers(mock, host)
  Statistics(mock, host)
  Transactions(mock, host)
  Votes(mock, host)
  Wallets(mock, host)
  Webhooks(mock, host)

  return mock
}
