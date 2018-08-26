'use strict'

module.exports = {
  enabled: true,
  maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 200,
  whitelist: [],
  allowedSenders: [],
  maxTransactionsPerRequest: 150,
  maxTransactionAge: 21600
}
