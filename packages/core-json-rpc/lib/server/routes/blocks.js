'use strict'

const handler = require('../handlers/blocks')

/**
 * Register the v1 routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/{network}/blocks/latest', ...handler.latest },
    { method: 'GET', path: '/{network}/blocks/{id}', ...handler.show },
    { method: 'GET', path: '/{network}/blocks/{id}/transactions', ...handler.transactions }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'Block Routes',
  version: '1.0.0',
  register
}
