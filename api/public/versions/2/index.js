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
    { method: 'GET', path: '/blockchain', ...blockchain.index },

    { method: 'GET', path: '/blocks', ...blocks.index },
    { method: 'GET', path: '/blocks/{id}', ...blocks.show },
    { method: 'GET', path: '/blocks/{id}/transactions', ...blocks.transactions },
    { method: 'GET', path: '/blocks/search', ...blocks.search },

    { method: 'GET', path: '/delegates', ...delegates.index },
    { method: 'GET', path: '/delegates/{id}', ...delegates.show },
    { method: 'GET', path: '/delegates/{id}/blocks', ...delegates.blocks },
    { method: 'GET', path: '/delegates/{id}/voters', ...delegates.voters },

    { method: 'GET', path: '/loader/status', ...loader.status },
    { method: 'GET', path: '/loader/syncing', ...loader.syncing },
    { method: 'GET', path: '/loader/configuration', ...loader.configuration },

    { method: 'GET', path: '/multisignatures', ...multisignatures.index },
    { method: 'GET', path: '/multisignatures/pending', ...multisignatures.pending },
    { method: 'GET', path: '/multisignatures/wallets', ...multisignatures.wallets },

    { method: 'GET', path: '/peers', ...peers.index },
    { method: 'GET', path: '/peers/me', ...peers.me },
    { method: 'GET', path: '/peers/{ip}', ...peers.show },

    { method: 'GET', path: '/signatures', ...signatures.index },

    { method: 'GET', path: '/statistics/blockchain', ...statistics.blockchain },
    { method: 'GET', path: '/statistics/transactions', ...statistics.transactions },
    { method: 'GET', path: '/statistics/blocks', ...statistics.blocks },
    { method: 'GET', path: '/statistics/votes', ...statistics.votes },
    { method: 'GET', path: '/statistics/unvotes', ...statistics.unvotes },

    { method: 'GET', path: '/transactions', ...transactions.index },
    { method: 'GET', path: '/transactions/{id}', ...transactions.show },
    { method: 'GET', path: '/transactions/unconfirmed', ...transactions.unconfirmed },
    { method: 'GET', path: '/transactions/unconfirmed/{id}', ...transactions.showUnconfirmed },
    { method: 'GET', path: '/transactions/search', ...transactions.search },

    { method: 'GET', path: '/votes', ...votes.index },
    { method: 'GET', path: '/votes/{id}', ...votes.show },

    { method: 'GET', path: '/wallets', ...wallets.index },
    { method: 'GET', path: '/wallets/top', ...wallets.top },
    { method: 'GET', path: '/wallets/{id}', ...wallets.show },
    { method: 'GET', path: '/wallets/{id}/transactions', ...wallets.transactions },
    { method: 'GET', path: '/wallets/{id}/transactions/send', ...wallets.transactionsSend },
    { method: 'GET', path: '/wallets/{id}/transactions/received', ...wallets.transactionsReceived },
    { method: 'GET', path: '/wallets/{id}/votes', ...wallets.votes },
    { method: 'GET', path: '/wallets/search', ...wallets.search }
  ])
}

exports.plugin = {
  name: 'ARK Public API - V2',
  version: '2.0.0',
  register
}
