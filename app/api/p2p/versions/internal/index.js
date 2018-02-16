const handlers = require('./handlers')

const register = async (server, options) => {
  server.route([
    { method: 'GET', path: '/internal/round', ...handlers.getRound },
    { method: 'POST', path: '/internal/block', ...handlers.postInternalBlock },
    { method: 'POST', path: '/internal/verifyTransaction', ...handlers.postVerifyTransaction }
  ])
}

exports.plugin = {
  name: 'ARK P2P API - Internal',
  version: '1.0.0',
  register
}
