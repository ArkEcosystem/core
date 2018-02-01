const blocks = require('./handlers/blocks')
const delegates = require('./handlers/delegates')
const loader = require('./handlers/loader')
const multisignatures = require('./handlers/multisignatures')
const peers = require('./handlers/peers')
const signatures = require('./handlers/signatures')
const transactions = require('./handlers/transactions')
const accounts = require('./handlers/accounts')

const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/v1/blocks', ...blocks.index },
    { method: 'GET', path: '/v1/blocks/get', ...blocks.show },
    { method: 'GET', path: '/v1/blocks/getEpoch', ...blocks.epoch },
    { method: 'GET', path: '/v1/blocks/getHeight', ...blocks.height },
    { method: 'GET', path: '/v1/blocks/getNethash', ...blocks.nethash },
    { method: 'GET', path: '/v1/blocks/getFee', ...blocks.fee },
    { method: 'GET', path: '/v1/blocks/getFees', ...blocks.fees },
    { method: 'GET', path: '/v1/blocks/getMilestone', ...blocks.milestone },
    { method: 'GET', path: '/v1/blocks/getReward', ...blocks.reward },
    { method: 'GET', path: '/v1/blocks/getSupply', ...blocks.supply },
    { method: 'GET', path: '/v1/blocks/getStatus', ...blocks.status },

    { method: 'GET', path: '/v1/delegates', ...delegates.index },
    { method: 'GET', path: '/v1/delegates/get', ...delegates.show },
    { method: 'GET', path: '/v1/delegates/count', ...delegates.count },
    { method: 'GET', path: '/v1/delegates/search', ...delegates.search },
    { method: 'GET', path: '/v1/delegates/voters', ...delegates.voters },
    { method: 'GET', path: '/v1/delegates/fee', ...delegates.fee },
    { method: 'GET', path: '/v1/delegates/forging/getForgedByWallet', ...delegates.forged },
    { method: 'GET', path: '/v1/delegates/getNextForgers', ...delegates.next },
    { method: 'POST', path: '/v1/delegates/forging/enable', ...delegates.enable },
    { method: 'POST', path: '/v1/delegates/forging/disable', ...delegates.disable },

    { method: 'GET', path: '/v1/loader/status', ...loader.status },
    { method: 'GET', path: '/v1/loader/status/sync', ...loader.syncing },
    { method: 'GET', path: '/v1/loader/autoconfigure', ...loader.autoconfigure },

    { method: 'GET', path: '/v1/multisignatures', ...multisignatures.index },
    { method: 'POST', path: '/v1/multisignatures', ...multisignatures.store },
    { method: 'GET', path: '/v1/multisignatures/pending', ...multisignatures.pending },
    { method: 'GET', path: '/v1/multisignatures/accounts', ...multisignatures.wallets },

    { method: 'GET', path: '/v1/peers', ...peers.index },
    { method: 'GET', path: '/v1/peers/get', ...peers.show },
    { method: 'GET', path: '/v1/peers/version', ...peers.version },

    { method: 'GET', path: '/v1/signatures/fee', ...signatures.fee },

    { method: 'GET', path: '/v1/transactions', ...transactions.index },
    { method: 'GET', path: '/v1/transactions/get', ...transactions.show },
    { method: 'GET', path: '/v1/transactions/unconfirmed', ...transactions.unconfirmed },
    { method: 'GET', path: '/v1/transactions/unconfirmed/get', ...transactions.showUnconfirmed },

    { method: 'GET', path: '/v1/accounts/getAllAccounts', ...accounts.index },
    { method: 'GET', path: '/v1/accounts', ...accounts.show },
    { method: 'GET', path: '/v1/accounts/getBalance', ...accounts.balance },
    { method: 'GET', path: '/v1/accounts/getPublicKey', ...accounts.publicKey },
    { method: 'GET', path: '/v1/accounts/delegates/fee', ...accounts.fee },
    { method: 'GET', path: '/v1/accounts/delegates', ...accounts.delegates },
    { method: 'GET', path: '/v1/accounts/top', ...accounts.top },
    { method: 'GET', path: '/v1/accounts/count', ...accounts.count }
  ])
}

exports.plugin = {
  name: 'ARK Public API - V1',
  version: '1.0.0',
  register
}
