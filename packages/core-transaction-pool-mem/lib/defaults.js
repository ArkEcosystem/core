'use strict'

module.exports = {
  enabled: true,
  maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 300,
  whitelist: [],
  allowedSenders: [],
  maxTransactionsPerRequest: 200,
  maxTransactionAge: 21600
}
