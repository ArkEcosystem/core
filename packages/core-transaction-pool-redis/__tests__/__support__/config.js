'use strict'

module.exports = {
  enabled: true,
  key: 'ark_test',
  maxTransactionsPerSender: 100,
  whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*'],
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
