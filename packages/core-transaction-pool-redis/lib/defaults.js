'use strict'

module.exports = {
  enabled: !process.env.PHANTOM_TRANSACTION_POOL_DISABLED,
  key: 'phantom',
  maxTransactionsPerSender: process.env.PHANTOM_TRANSACTION_POOL_MAX_PER_SENDER || 100,
  allowedSenders: [],
  redis: {
    host: process.env.PHANTOM_REDIS_HOST || 'localhost',
    port: process.env.PHANTOM_REDIS_PORT || 6379
  }
}
