'use strict'

const blockchain = require('./handlers/blockchain')
const blocks = require('./handlers/blocks')
const network = require('./handlers/network')
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
    { method: 'GET', path: '/network/state', ...network.state },

    { method: 'GET', path: '/blockchain/sync', ...blockchain.sync },

    { method: 'POST', path: '/blocks', ...blocks.store },

    { method: 'GET', path: '/rounds/current', ...rounds.current },

    { method: 'POST', path: '/transactions/verify', ...transactions.verify },
    { method: 'GET', path: '/transactions/forging', ...transactions.forging },

    { method: 'GET', path: '/utils/usernames', ...utils.usernames },
    { method: 'POST', path: '/utils/events', ...utils.emitEvent }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'Ark P2P API - Internal',
  version: '0.1.0',
  register
}
