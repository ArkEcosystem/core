const logger = require('app/core/logger')
const Transaction = require('app/models/transaction')
const arkjs = require('arkjs')
const async = require('async')
const BlockchainManager = require('app/core/managers/blockchain')
const RedisManager = require('app/core/managers/redis')

let instance = null

module.exports = class TransactionPool {
  static getInstance () {
    return instance
  }

  constructor (config) {
    this.db = BlockchainManager.getInstance().getDb()
    this.config = config
    this.redis = this.config.server.transactionPool.enabled ? new RedisManager(config) : false

    if (!instance) {
      instance = this
    }

    const that = this
    this.queue = async.queue((transaction, qcallback) => {
      if (that.verify(transaction)) {
        // for expiration testing
        if (this.config.server.test) {
          // transaction.data.expiration = arkjs.slots.getTime() + Math.floor(Math.random() * Math.floor(100000) + 1)
          transaction.data.timelock = arkjs.slots.getTime() + 50
        }
        that.addTransactionToRedis(transaction)
      }
      qcallback()
    }, 1)

    if (!config.server.transactionPool.enabled) {
      logger.warning('Transaction pool IS DISABLED')
    }
    return instance
  }

  async addTransaction (transaction) {
    if (this.redis) {
      this.queue.push(new Transaction(transaction))
    }
  }

  async addTransactions (transactions) {
    if (this.redis && (await this.redis.getPoolSize() < this.config.server.transactionPool.maxPoolSize)) {
      this.queue.push(transactions.map(tx => new Transaction(tx)))
    } else {
      logger.info('Transactions not added to the transaction pool. Pool is disabled or reached maximum size.')
    }
  }

  verify (transaction) {
    const wallet = this.db.walletManager.getWalletByPublicKey(transaction.senderPublicKey)
    if (arkjs.crypto.verify(transaction) && wallet.canApply(transaction)) {
      this.db.walletManager.applyTransaction(transaction)
      return true
    }
  }

  async undoBlock (block) { // we add back the block txs to the pool
    if (block.transactions.length === 0) return
    // no return the main thread is liberated
    this.redis.addTransactions(block.transactions.map(tx => tx.data))
  }

  async addTransactionToRedis (object) {
    if (this.redis) {
      await this.redis.addTransaction(object)
    }
  }

  async removeForgedBlock (transactions) { // we remove the block txs from the pool
    if (this.redis) {
      await this.redis.removeTransactions(transactions)
    }
  }

  async getUnconfirmedTransactions (start, size) {
    return this.redis.getTransactionsForForger(start, size)
  }

  async getUnconfirmedTransaction (id) {
    return this.redis.getTransaction(id)
  }

  async getPoolSize () {
    return this.redis.getPoolSize()
  }

  // rebuildBlockHeader (block) {

  // }
}
