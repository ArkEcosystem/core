'use strict'

module.exports = {
  enabled: !process.env.ARK_TRANSACTION_POOL_DISABLED,
  syncInterval: 512,
  storage: `${process.env.ARK_PATH_DATA}/database/transaction-pool-${process.env.ARK_NETWORK_NAME}.sqlite`,
  maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 300,
  whitelist: [],
  allowedSenders: [],
  maxTransactionsPerRequest: 40,
  maxTransactionAge: 2700
}
