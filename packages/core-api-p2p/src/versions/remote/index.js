'use strict';

const handlers = require('./handlers')

const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/blockchain/{event}', ...handlers.sendBlockchainEvent }
  ])
}

exports.plugin = {
  name: 'ARK P2P API - Remote',
  version: '1.0.0',
  register
}
