'use strict'

module.exports = {
  enabled: process.env.ARK_TRANSACTION_POOL_ENABLED || true,
  maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 100,
  allowedSenders: [],
  database: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: process.env.ARK_DB_LOGGING || false
  }
}
