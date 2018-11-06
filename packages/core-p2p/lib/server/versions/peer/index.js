'use strict'

const blockchain = require('./handlers/blockchain')
const blocks = require('./handlers/blocks')
const peers = require('./handlers/peers')
const transactions = require('./handlers/transactions')

/**
 * Register peer routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/blockchain/height', ...blockchain.height },
    { method: 'GET', path: '/blockchain/status', ...blockchain.status },

    { method: 'GET', path: '/peers', ...peers.index },

    { method: 'GET', path: '/blocks', ...blocks.index },
    { method: 'POST', path: '/blocks', ...blocks.store },
    { method: 'GET', path: '/blocks/common', ...blocks.common },

    { method: 'GET', path: '/transactions', ...transactions.index },
    { method: 'POST', path: '/transactions', ...transactions.store },
    { method: 'POST', path: '/transactions/search', ...transactions.search }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'Ark P2P - Peer API',
  version: '0.1.0',
  register
}
