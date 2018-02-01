const blockchain = require('./handlers/blockchain')
const blocks = require('./handlers/blocks')
const delegates = require('./handlers/delegates')
const loader = require('./handlers/loader')
const multisignatures = require('./handlers/multisignatures')
const peers = require('./handlers/peers')
const signatures = require('./handlers/signatures')
const statistics = require('./handlers/statistics')
const transactions = require('./handlers/transactions')
const votes = require('./handlers/votes')
const wallets = require('./handlers/wallets')

const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/v2/blockchain', ...blockchain.index },

    { method: 'GET', path: '/v2/blocks', ...blocks.index },
    { method: 'GET', path: '/v2/blocks/{id}', ...blocks.show },
    { method: 'GET', path: '/v2/blocks/{id}/transactions', ...blocks.transactions },
    { method: 'GET', path: '/v2/blocks/search', ...blocks.search },

    { method: 'GET', path: '/v2/delegates', ...delegates.index },
    { method: 'GET', path: '/v2/delegates/{id}', ...delegates.show },
    { method: 'GET', path: '/v2/delegates/{id}/blocks', ...delegates.blocks },
    { method: 'GET', path: '/v2/delegates/{id}/voters', ...delegates.voters },

    { method: 'GET', path: '/v2/loader/status', ...loader.status },
    { method: 'GET', path: '/v2/loader/syncing', ...loader.syncing },
    { method: 'GET', path: '/v2/loader/configuration', ...loader.configuration },

    { method: 'GET', path: '/v2/multisignatures', ...multisignatures.index },
    { method: 'GET', path: '/v2/multisignatures/pending', ...multisignatures.pending },
    { method: 'GET', path: '/v2/multisignatures/wallets', ...multisignatures.wallets },

    { method: 'GET', path: '/v2/peers', ...peers.index },
    { method: 'GET', path: '/v2/peers/me', ...peers.me },
    { method: 'GET', path: '/v2/peers/{ip}', ...peers.show },

    { method: 'GET', path: '/v2/signatures', ...signatures.index },

    { method: 'GET', path: '/v2/statistics/blockchain', ...statistics.blockchain },
    { method: 'GET', path: '/v2/statistics/transactions', ...statistics.transactions },
    { method: 'GET', path: '/v2/statistics/blocks', ...statistics.blocks },
    { method: 'GET', path: '/v2/statistics/votes', ...statistics.votes },
    { method: 'GET', path: '/v2/statistics/unvotes', ...statistics.unvotes },

    { method: 'GET', path: '/v2/transactions', ...transactions.index },
    { method: 'GET', path: '/v2/transactions/{id}', ...transactions.show },
    { method: 'GET', path: '/v2/transactions/unconfirmed', ...transactions.unconfirmed },
    { method: 'GET', path: '/v2/transactions/unconfirmed/{id}', ...transactions.showUnconfirmed },
    { method: 'GET', path: '/v2/transactions/search', ...transactions.search },

    { method: 'GET', path: '/v2/votes', ...votes.index },
    { method: 'GET', path: '/v2/votes/{id}', ...votes.show },

    { method: 'GET', path: '/v2/wallets', ...wallets.index },
    { method: 'GET', path: '/v2/wallets/top', ...wallets.top },
    { method: 'GET', path: '/v2/wallets/{id}', ...wallets.show },
    { method: 'GET', path: '/v2/wallets/{id}/transactions', ...wallets.transactions },
    { method: 'GET', path: '/v2/wallets/{id}/transactions/send', ...wallets.transactionsSend },
    { method: 'GET', path: '/v2/wallets/{id}/transactions/received', ...wallets.transactionsReceived },
    { method: 'GET', path: '/v2/wallets/{id}/votes', ...wallets.votes },
    { method: 'GET', path: '/v2/wallets/search', ...wallets.search }
  ])
}

exports.plugin = {
  name: 'ARK Public API - V2',
  version: '2.0.0',
  register
}
