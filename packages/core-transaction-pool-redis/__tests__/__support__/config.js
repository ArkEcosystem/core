'use strict'

module.exports = {
  enabled: true,
  key: 'phantom_test',
  maxTransactionsPerSender: 100,
  allowedSenders: ['03dde379eb1da857f523c3b3560eb4bb7b99897df2054bd9774f49dd0371ee99b7'],
  redis: {
    host: process.env.PHANTOM_REDIS_HOST || 'localhost',
    port: process.env.PHANTOM_REDIS_PORT || 6379
  }
}
