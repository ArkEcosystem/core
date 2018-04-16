const logger = require('@arkecosystem/core-pluggy').get('logger')
const { Transaction } = require('@arkecosystem/client').models
const { crypto, slots } = require('@arkecosystem/client')
const async = require('async')

// FIXME: expose this via module loader
const BlockchainManager = require('../../core-blockchain/src/manager')
const TransactionPoolManager = require('./manager')

let instance

module.exports = class Handler {
  static getInstance () {
    return instance
  }

  constructor (config) {
    this.db = BlockchainManager.getInstance().getDb()
    this.config = config
    this.poolManager = config.enabled ? new TransactionPoolManager(config) : false

    if (!instance) {
      instance = this
    }

    const that = this
    this.queue = async.queue((transaction, qcallback) => {
      if (that.verify(transaction)) {
        that.addTransactionToRedis(transaction)
      }
      qcallback()
    }, 1)

    if (!config.enabled) {
      logger.warning('Transaction pool IS DISABLED')
    }
    return instance
  }

  async addTransaction (transaction) {
    if (this.poolManager) {
      this.queue.push(new Transaction(transaction))
    }
  }

  async addTransactions (transactions) {
    this.queue.push(transactions.map(tx => {
      let transaction = new Transaction(tx)

      // TODO for TESTING - REMOVE LATER ON expiration and time lock testing remove from production
      if (this.config.server.test) {
        const current = slots.getTime()
        transaction.data.expiration = current + Math.floor(Math.random() * Math.floor(1000) + 1)

        if (Math.round(Math.random() * Math.floor(1)) === 0) {
          transaction.data.timelocktype = 0 // timestamp
          transaction.data.timelock = current + Math.floor(Math.random() * Math.floor(50) + 1)
        } else {
          transaction.data.timelocktype = 1 // block
          transaction.data.timelock = BlockchainManager.getInstance().getState().lastBlock.data.height + Math.floor(Math.random() * Math.floor(20) + 1)
        }
      }
      return transaction
    }))
  }

  verify (transaction) {
    const wallet = this.db.walletManager.getWalletByPublicKey(transaction.senderPublicKey)
    if (crypto.verify(transaction) && wallet.canApply(transaction)) {
      this.db.walletManager.applyTransaction(transaction)
      return true
    }
  }

  async undoBlock (block) { // we add back the block txs to the pool
    if (block.transactions.length === 0) return
    // no return the main thread is liberated
    this.addTransactions(block.transactions.map(tx => tx.data))
  }

  async addTransactionToRedis (object) {
    if (this.poolManager) {
      await this.poolManager.addTransaction(object)
    }
  }

  async removeForgedTransactions (transactions) { // we remove the txs from the pool
    if (this.poolManager) {
      await this.poolManager.removeTransactions(transactions)
    }
  }

  async getUnconfirmedTransactions (start, size) {
    return this.poolManager.getTransactions(start, size)
  }

  async getTransactionsForForging (start, size) {
    return this.poolManager.getTransactionsForForging(start, size)
  }

  async getUnconfirmedTransaction (id) {
    return this.poolManager.getTransaction(id)
  }

  async getPoolSize () {
    return this.poolManager.getPoolSize()
  }

  // rebuildBlockHeader (block) {

  // }
}
