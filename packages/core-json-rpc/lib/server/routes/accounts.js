'use strict'

const handler = require('../handlers/accounts')

/**
 * Register the v1 routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/{network}/accounts/bip38/{userId}', ...handler.getBip38Account },
    { method: 'GET', path: '/{network}/accounts/{address}', ...handler.show },
    { method: 'GET', path: '/{network}/accounts/{address}/transactions', ...handler.transactions },
    { method: 'POST', path: '/{network}/accounts', ...handler.create },
    { method: 'POST', path: '/{network}/accounts/bip38', ...handler.createBip38 }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'Account Routes',
  version: '1.0.0',
  register
}
