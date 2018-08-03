'use strict'

module.exports = {
  enabled: !process.env.ARK_TRANSACTION_POOL_DISABLED,
  key: 'ark',
  maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 100,
  allowedSenders: [],
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
