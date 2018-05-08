'use strict'

module.exports = {
  enabled: true,
  key: 'ark/pool',
  maxTransactionsPerSender: 100,
  whiteList: [],
  redis: {
    host: 'localhost',
    port: 6379
  }
}
