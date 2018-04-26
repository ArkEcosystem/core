'use strict';

const handlers = require('./handlers')

/**
 * [description]
 * @param  {[type]} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/round', ...handlers.getRound },
    { method: 'POST', path: '/block', ...handlers.postInternalBlock },
    { method: 'POST', path: '/verifyTransaction', ...handlers.postVerifyTransaction },
    { method: 'GET', path: '/forgingTransactions', ...handlers.getTransactionsForForging }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'ARK P2P API - Internal',
  version: '1.0.0',
  register
}
