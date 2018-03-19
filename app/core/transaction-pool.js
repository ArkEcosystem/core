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
      this.queue.push(transactions.map(tx => {
        let transaction = new Transaction(tx)

        // TODO for expiration and time lock testing remove from production
        if (this.config.server.test) {
          const current = arkjs.slots.getTime()
          transaction.data.expiration = current + Math.floor(Math.random() * Math.floor(1000) + 1)

          if (Math.round(Math.random() * Math.floor(1)) === 0) {
            transaction.data.timelocktype = 0 // or 1 for blockcheight
            transaction.data.timelock = current + Math.floor(Math.random() * Math.floor(50) + 1)
          } else {
            transaction.data.timelocktype = 1 // or 1 for blockcheight
            transaction.data.timelock = BlockchainManager.getInstance().getState().lastBlock.data.height + Math.floor(Math.random() * Math.floor(5) + 1)
          }
        }

        return transaction
      }))
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
