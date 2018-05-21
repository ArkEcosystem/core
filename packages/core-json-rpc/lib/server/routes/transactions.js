'use strict'

const handler = require('../handlers/transactions')

/**
 * Register the v1 routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/{network}/transactions', ...handler.index },
    { method: 'GET', path: '/{network}/transactions/{id}', ...handler.show },
    { method: 'POST', path: '/{network}/transactions/bip38', ...handler.createBip38 },
    { method: 'POST', path: '/{network}/transactions', ...handler.create },
    { method: 'POST', path: '/{network}/transactions/broadcast', ...handler.broadcast }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'Transaction Routes',
  version: '1.0.0',
  register
}
