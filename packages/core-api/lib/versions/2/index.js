'use strict'

const blockchain = require('./handlers/blockchain')
const blocks = require('./handlers/blocks')
const delegates = require('./handlers/delegates')
const node = require('./handlers/node')
const peers = require('./handlers/peers')
const transactions = require('./handlers/transactions')
const votes = require('./handlers/votes')
const wallets = require('./handlers/wallets')

/**
 * Register the v2 routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/blockchain', ...blockchain.index },

    { method: 'GET', path: '/blocks', ...blocks.index },
    { method: 'GET', path: '/blocks/{id}', ...blocks.show },
    { method: 'GET', path: '/blocks/{id}/transactions', ...blocks.transactions },
    { method: 'POST', path: '/blocks/search', ...blocks.search },

    { method: 'GET', path: '/delegates', ...delegates.index },
    { method: 'GET', path: '/delegates/{id}', ...delegates.show },
    { method: 'GET', path: '/delegates/{id}/blocks', ...delegates.blocks },
    { method: 'GET', path: '/delegates/{id}/voters', ...delegates.voters },
    { method: 'GET', path: '/delegates/{id}/voters/balances', ...delegates.voterBalances },
    { method: 'POST', path: '/delegates/search', ...delegates.search },

    { method: 'GET', path: '/node/status', ...node.status },
    { method: 'GET', path: '/node/syncing', ...node.syncing },
    { method: 'GET', path: '/node/configuration', ...node.configuration },

    { method: 'GET', path: '/peers', ...peers.index },
    { method: 'GET', path: '/peers/suspended', ...peers.suspended },
    { method: 'GET', path: '/peers/{ip}', ...peers.show },

    { method: 'GET', path: '/transactions', ...transactions.index },
    { method: 'POST', path: '/transactions', ...transactions.store },
    { method: 'GET', path: '/transactions/{id}', ...transactions.show },
    { method: 'GET', path: '/transactions/unconfirmed', ...transactions.unconfirmed },
    { method: 'GET', path: '/transactions/unconfirmed/{id}', ...transactions.showUnconfirmed },
    { method: 'POST', path: '/transactions/search', ...transactions.search },
    { method: 'GET', path: '/transactions/types', ...transactions.types },
    { method: 'GET', path: '/transactions/fees', ...transactions.fees },

    { method: 'GET', path: '/votes', ...votes.index },
    { method: 'GET', path: '/votes/{id}', ...votes.show },

    { method: 'GET', path: '/wallets', ...wallets.index },
    { method: 'GET', path: '/wallets/top', ...wallets.top },
    { method: 'GET', path: '/wallets/{id}', ...wallets.show },
    { method: 'GET', path: '/wallets/{id}/transactions', ...wallets.transactions },
    { method: 'GET', path: '/wallets/{id}/transactions/sent', ...wallets.transactionsSent },
    { method: 'GET', path: '/wallets/{id}/transactions/received', ...wallets.transactionsReceived },
    { method: 'GET', path: '/wallets/{id}/votes', ...wallets.votes },
    { method: 'POST', path: '/wallets/search', ...wallets.search }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'Ark Public API - v2',
  version: '2.0.0',
  register
}
