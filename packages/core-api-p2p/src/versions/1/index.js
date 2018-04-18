'use strict';

const handlers = require('./handlers')

const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/peer/list', ...handlers.getPeers },
    { method: 'GET', path: '/peer/blocks', ...handlers.getBlocks },
    { method: 'GET', path: '/peer/transactionsFromIds', ...handlers.getTransactionsFromIds },
    { method: 'GET', path: '/peer/height', ...handlers.getHeight },
    { method: 'GET', path: '/peer/transactions', ...handlers.getTransactions },
    { method: 'GET', path: '/peer/blocks/common', ...handlers.getCommonBlock },
    { method: 'GET', path: '/peer/status', ...handlers.getStatus },
    { method: 'POST', path: '/peer/blocks', ...handlers.postBlock },
    { method: 'POST', path: '/peer/transactions', ...handlers.postTransactions }
  ])
}

exports.plugin = {
  name: 'ARK P2P API - v1',
  version: '1.0.0',
  register
}
