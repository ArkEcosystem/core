const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const Accounts = require('./accounts')
const Blocks = require('./blocks')
const Delegates = require('./delegates')
const Loader = require('./loader')
const Peers = require('./peers')
const Signatures = require('./signatures')
const Transactions = require('./transactions')

module.exports = config => {
  const mock = new MockAdapter(axios)
  const { host } = config

  Accounts(mock, host)
  Blocks(mock, host)
  Delegates(mock, host)
  Loader(mock, host)
  Peers(mock, host)
  Signatures(mock, host)
  Transactions(mock, host)

  return mock
}
