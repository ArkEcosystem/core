const Redis = require('ioredis')
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
    this.redis = this.config.server.transactionPool.enabled ? new RedisManager(config) : null

    if (!instance) {
      instance = this
    }

    const that = this
    this.queue = async.queue((transaction, qcallback) => {
      if (that.verify(transaction)) {
        // for expiration testing
        if (this.config.server.test) transaction.data.expiration = arkjs.slots.getTime() + Math.floor(Math.random() * Math.floor(20) + 1)
        that.add(transaction)
      }
      qcallback()
    }, 1)

    if (!config.server.transactionPool.enabled) {
      logger.warning('Transaction pool IS DISABLED')
    }
    return instance
  }

  async getPoolSize () {
    return this.redis ? this.redis.llen(this.__getRedisOrderKey()) : -1
  }

  async add (object) {
    if (this.redis && object instanceof Transaction) {
      try {
        await this.redis.hset(this.__getRedisTransactionKey(object.id), 'serialized', object.serialized.toString('hex'), 'timestamp', object.data.timestamp, 'expiration', object.data.expiration, 'senderPublicKey', object.data.senderPublicKey, 'timeLock', object.data.timelock)
        await this.redis.rpush(this.__getRedisOrderKey(), object.id)

        if (object.data.expiration > 0) {
          await this.redis.expire(this.__getRedisTransactionKey(object.id), object.data.expiration - object.data.timestamp)
        }
      } catch (error) {
        logger.error('Error adding transaction to transaction pool error')
        logger.error(error.stack)
      }
    }
  }

  async removeForgedBlock (transactions) { // we remove the block txs from the pool
    if (this.redis) {
      await this.redis.removeTransactions(transactions)
    }
  }

  async getUnconfirmedTransactions (start, size) {
    return this.redis.getTraansactions(start, size)
  }

  async getUnconfirmedTransaction (id) {
    return this.redis.getTransaction(id)
  }

  async addTransaction (transaction) {
    if (this.redis) {
      this.queue.push(new Transaction(transaction))
    }
  }

  async addTransactions (transactions) {
    if (this.redis) {
      if (this.getPoolSize() > this.config.server.transaction.maxPoolSize) {
        this.queue.push(transactions.map(tx => new Transaction(tx)))
      } else {
        logger.warning('Transactions size reached maxium.')
      }
    } else {
      logger.info('Transactions not added to the transaction pool. Pool is disabled.')
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

  // rebuildBlockHeader (block) {

  // }
}
