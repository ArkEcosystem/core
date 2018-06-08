'use strict'

module.exports = {
  enabled: true,
  key: 'ark',
  maxTransactionsPerSender: 100,
  whitelist: ['03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357'],
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
