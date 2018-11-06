'use strict'

const handlers = require('./handlers')

/**
 * Register v1 routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/list', ...handlers.getPeers },
    { method: 'GET', path: '/blocks', ...handlers.getBlocks },
    { method: 'GET', path: '/transactionsFromIds', ...handlers.getTransactionsFromIds },
    { method: 'GET', path: '/height', ...handlers.getHeight },
    { method: 'GET', path: '/transactions', ...handlers.getTransactions },
    { method: 'GET', path: '/blocks/common', ...handlers.getCommonBlocks },
    { method: 'GET', path: '/status', ...handlers.getStatus },
    { method: 'POST', path: '/blocks', ...handlers.postBlock },
    { method: 'POST', path: '/transactions', ...handlers.postTransactions }
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'Ark P2P API - v1',
  version: '0.1.0',
  register
}
