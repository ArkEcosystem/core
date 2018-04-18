'use strict';

const handlers = require('./handlers')

/**
 * [description]
 * @param  {[type]} server  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/blockchain/{event}', ...handlers.sendBlockchainEvent }
  ])
}

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  name: 'ARK P2P API - Remote',
  version: '1.0.0',
  register
}
