'use strict'

module.exports = {
  enabled: false,
  host: process.env.ARK_API_HOST || 'localhost',
  port: process.env.ARK_API_PORT || 4003,
  versions: {
    default: 1,
    valid: [1, 2]
  },
  cache: {
    enabled: false,
    options: {
      name: 'redisCache',
      engine: 'catbox-redis',
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379,
      partition: 'cache',
      expiresIn: 60000
    }
  },
  rateLimit: {
    enabled: false,
    limit: 300,
    expires: 60000
  },
  pagination: {
    limit: 100,
    include: [
      '/api/v2/blocks',
      '/api/v2/blocks/{id}/transactions',
      '/api/v2/blocks/search',
      '/api/v2/delegates',
      '/api/v2/delegates/{id}/blocks',
      '/api/v2/delegates/{id}/voters',
      '/api/v2/peers',
      '/api/v2/transactions',
      '/api/v2/transactions/search',
      '/api/v2/votes',
      '/api/v2/wallets',
      '/api/v2/wallets/top',
      '/api/v2/wallets/{id}/transactions',
      '/api/v2/wallets/{id}/transactions/received',
      '/api/v2/wallets/{id}/transactions/sent',
      '/api/v2/wallets/{id}/votes',
      '/api/v2/wallets/search'
    ]
  }
}
