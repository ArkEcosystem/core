'use strict'

module.exports = {
  enabled: true,
  key: 'ark',
  maxTransactionsPerSender: 100,
  whitelist: ['127.0.0.1', '192.168.*'],
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
