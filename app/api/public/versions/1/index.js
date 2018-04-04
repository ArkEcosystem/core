const blocks = require('./handlers/blocks')
const delegates = require('./handlers/delegates')
const node = require('./handlers/node')
const peers = require('./handlers/peers')
const signatures = require('./handlers/signatures')
const transactions = require('./handlers/transactions')
const accounts = require('./handlers/accounts')

const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/blocks', ...blocks.index },
    { method: 'GET', path: '/blocks/get', ...blocks.show },
    { method: 'GET', path: '/blocks/getEpoch', ...blocks.epoch },
    { method: 'GET', path: '/blocks/getHeight', ...blocks.height },
    { method: 'GET', path: '/blocks/getNethash', ...blocks.nethash },
    { method: 'GET', path: '/blocks/getFee', ...blocks.fee },
    { method: 'GET', path: '/blocks/getFees', ...blocks.fees },
    { method: 'GET', path: '/blocks/getMilestone', ...blocks.milestone },
    { method: 'GET', path: '/blocks/getReward', ...blocks.reward },
    { method: 'GET', path: '/blocks/getSupply', ...blocks.supply },
    { method: 'GET', path: '/blocks/getStatus', ...blocks.status },

    { method: 'GET', path: '/delegates', ...delegates.index },
    { method: 'GET', path: '/delegates/get', ...delegates.show },
    { method: 'GET', path: '/delegates/count', ...delegates.count },
    { method: 'GET', path: '/delegates/search', ...delegates.search },
    { method: 'GET', path: '/delegates/voters', ...delegates.voters },
    { method: 'GET', path: '/delegates/fee', ...delegates.fee },
    { method: 'GET', path: '/delegates/forging/getForgedByAccount', ...delegates.forged },

    { method: 'GET', path: '/node/status', ...node.status },
    { method: 'GET', path: '/node/status/sync', ...node.syncing },
    { method: 'GET', path: '/node/autoconfigure', ...node.autoconfigure },

    { method: 'GET', path: '/peers', ...peers.index },
    { method: 'GET', path: '/peers/get', ...peers.show },
    { method: 'GET', path: '/peers/version', ...peers.version },

    { method: 'GET', path: '/signatures/fee', ...signatures.fee },

    { method: 'GET', path: '/transactions', ...transactions.index },
    { method: 'GET', path: '/transactions/get', ...transactions.show },
    { method: 'GET', path: '/transactions/unconfirmed', ...transactions.unconfirmed },
    { method: 'GET', path: '/transactions/unconfirmed/get', ...transactions.showUnconfirmed },

    { method: 'GET', path: '/accounts/getAllAccounts', ...accounts.index },
    { method: 'GET', path: '/accounts', ...accounts.show },
    { method: 'GET', path: '/accounts/getBalance', ...accounts.balance },
    { method: 'GET', path: '/accounts/getPublicKey', ...accounts.publicKey },
    { method: 'GET', path: '/accounts/delegates/fee', ...accounts.fee },
    { method: 'GET', path: '/accounts/delegates', ...accounts.delegates },
    { method: 'GET', path: '/accounts/top', ...accounts.top },
    { method: 'GET', path: '/accounts/count', ...accounts.count }
  ])
}

exports.plugin = {
  name: 'ARK Public API - V1',
  version: '1.0.0',
  register
}
