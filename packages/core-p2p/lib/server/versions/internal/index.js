'use strict'

const blockchain = require('./handlers/blockchain')
const blocks = require('./handlers/blocks')
const rounds = require('./handlers/rounds')
const transactions = require('./handlers/transactions')
const utils = require('./handlers/utils')

/**
 * Register internal routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/rounds/current', ...rounds.current },

    { method: 'POST', path: '/blocks', ...blocks.store },

    { method: 'POST', path: '/transactions/verify', ...transactions.postVerifyTransaction },
    { method: 'GET', path: '/transactions/forging', ...transactions.getTransactionsForForging },

    { method: 'GET', path: '/blockchain/network-state', ...blockchain.networkState },
    { method: 'GET', path: '/blockchain/synced', ...blockchain.synced },

    { method: 'GET', path: '/utils/usernames', ...utils.usernames },
    { method: 'POST', path: '/utils/events', ...utils.emitEvent }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'ARK P2P API - Internal',
  version: '0.1.0',
  register
}
