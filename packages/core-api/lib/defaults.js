'use strict'

const path = require('path')

module.exports = {
  enabled: false,
  host: process.env.ARK_API_HOST || '0.0.0.0',
  port: process.env.ARK_API_PORT || 4003,
  // @see https://github.com/p-meier/hapi-api-version
  versions: {
    validVersions: [1, 2],
    defaultVersion: 1,
    basePath: '/api/',
    vendorName: 'ark.core-api'
  },
  cache: {
    enabled: false,
    options: {}
  },
  // @see https://github.com/wraithgar/hapi-rate-limit
  rateLimit: {
    enabled: true,
    pathLimit: false,
    userLimit: 300,
    userCache: {
      expiresIn: 60000
    }
  },
  // @see https://github.com/fknop/hapi-pagination
  pagination: {
    limit: 100,
    include: [
      '/api/v2/blocks',
      '/api/v2/blocks/{id}/transactions',
      '/api/v2/blocks/search',
      '/api/v2/delegates',
      '/api/v2/delegates/{id}/blocks',
      '/api/v2/delegates/{id}/voters',
      '/api/v2/delegates/search',
      '/api/v2/peers',
      '/api/v2/transactions',
      '/api/v2/transactions/search',
      '/api/v2/transactions/unconfirmed',
      '/api/v2/votes',
      '/api/v2/wallets',
      '/api/v2/wallets/top',
      '/api/v2/wallets/{id}/transactions',
      '/api/v2/wallets/{id}/transactions/received',
      '/api/v2/wallets/{id}/transactions/sent',
      '/api/v2/wallets/{id}/votes',
      '/api/v2/wallets/search'
    ]
  },
  whitelist: [
    '127.0.0.1',
    '::ffff:127.0.0.1'
  ],
  plugins: [{
    plugin: path.resolve(__dirname, './versions/1'),
    routes: { prefix: '/api/v1' }
  }, {
    plugin: path.resolve(__dirname, './versions/2'),
    routes: { prefix: '/api/v2' }
  }]
}
