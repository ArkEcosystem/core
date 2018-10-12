'use strict'

module.exports = {
  enabled: true,
  // How often to save/sync the transaction pool to a persistent storage.
  // The number designates count of added or deleted transactions that are not in
  // the persistent storage. When that number is reached a new sync of the pool is
  // triggered.
  syncInterval: 512,
  storage: `${process.env.ARK_PATH_DATA}/database/transaction-pool-${process.env.ARK_NETWORK_NAME}.sqlite`,
  maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 300,
  whitelist: [],
  allowedSenders: [],
  maxTransactionsPerRequest: 200,
  maxTransactionAge: 21600
}
