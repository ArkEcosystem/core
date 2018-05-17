'use strict'

module.exports = {
  enabled: true,
  key: 'ark/pool',
  maxTransactionsPerSender: 100,
  whitelist: [],
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
