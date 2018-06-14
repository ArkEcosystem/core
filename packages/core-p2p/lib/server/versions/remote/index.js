'use strict'

const handlers = require('./handlers')

/**
 * Register remote routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/blockchain/{event}', ...handlers.sendBlockchainEvent }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'ARK P2P API - Remote',
  version: '0.1.0',
  register
}
