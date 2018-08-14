'use strict'

const handlers = require('./handlers')

/**
 * Register internal routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/round', ...handlers.getRound },
    { method: 'POST', path: '/block', ...handlers.postInternalBlock },
    { method: 'POST', path: '/verifyTransaction', ...handlers.postVerifyTransaction },
    { method: 'GET', path: '/forgingTransactions', ...handlers.getTransactionsForForging },
    { method: 'GET', path: '/networkState', ...handlers.getNetworkState },
    { method: 'GET', path: '/syncCheck', ...handlers.checkBlockchainSynced },
    { method: 'GET', path: '/usernames', ...handlers.getUsernames }
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
