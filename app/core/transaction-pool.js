const Redis = require('ioredis')
const logger = require('app/core/logger')
const Transaction = require('app/models/transaction')
const arkjs = require('arkjs')
const async = require('async')
const BlockchainManager = require('app/core/managers/blockchain')

let instance = null

module.exports = class TransactionPool {
  constructor (config) {
    this.isConnected = false
    this.keyPrefix = config.server.transactionPool.keyPrefix
    this.db = BlockchainManager.getInstance().getDb()
    this.config = config
    this.counters = {}

    if (!instance) {
      instance = this
    }

    logger.info(`Transaction pool initialized with connection status ${this.isConnected}`)
    if (!config.server.transactionPool.enabled) {
      logger.warning('Transaction pool IS DISABLED')
    }
    return instance
  }

  async init () {
    this.redis = this.config.server.transactionPool.enabled ? new Redis(this.config.server.redis) : null
    this.redisSub = this.config.server.transactionPool.enabled ? new Redis(this.config.server.redis) : null

    const that = this
    this.queue = async.queue((transaction, qcallback) => {
      if (that.verify(transaction)) {
        // for expiration testing
        if (this.config.server.test) transaction.data.expiration = arkjs.slots.getTime() + Math.floor(Math.random() * Math.floor(1000) + 1)
        that.add(transaction)
      }
      qcallback()
    }, 1)

    if (this.redis) {
      this.redis.on('connect', () => {
        logger.info('Redis connection established.')
        that.isConnected = true
        that.redis.config('set', 'notify-keyspace-events', 'Ex')
        that.redisSub.subscribe('__keyevent@0__:expired')
      })

      this.redisSub.on('message', (channel, message) => {
        // logger.debug(`Receive message ${message} from channel ${channel}`)
        this.removeTransaction(message.split('/')[3])
      })
    }
    return instance
  }

  static getInstance () {
    return instance
  }

  async size () {
    return this.isConnected ? this.redis.llen(this.__getRedisOrderKey()) : -1
  }

  async add (object) {
    if (this.isConnected && object instanceof Transaction) {
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
    if (this.isConnected) {
      try {
        for (let transaction of transactions) {
          // logger.debug(`Removing forged transaction ${transaction.id} from redis pool`)
          await this.removeTransaction(transaction.id)
        }
      } catch (error) {
        logger.error(`Error removing forged transactions from pool ${error.stack}`)
      }
    }
  }

  async removeTransaction (txID) {
    await this.redis.lrem(this.__getRedisOrderKey(), 1, txID)
    await this.redis.del(this.__getRedisTransactionKey(txID))
  }

  async getUnconfirmedTransactions (start, size) {
    if (this.isConnected) {
      try {
        const transactionIds = await this.redis.lrange(this.__getRedisOrderKey(), start, start + size - 1)
        let retList = []
        for (const id of transactionIds) {
          const serTrx = await this.redis.hget(this.__getRedisTransactionKey(id), 'serialized')
          serTrx ? retList.push(serTrx) : await this.removeTransaction(id)
        }
        return retList
      } catch (error) {
        logger.error('Get serialized items from redis list: ', error)
        logger.error(error.stack)
      }
    }
  }

  async getUnconfirmedTransaction (id) {
    if (this.isConnected) {
      const serialized = await this.redis.hget(this.__getRedisTransactionKey(id), 'serialized')
      if (serialized) {
        return Transaction.fromBytes(serialized)
      } else {
        return 'Error: Non existing transaction'
      }
    }
  }

  async addTransaction (transaction) {
    if (this.isConnected) {
      this.queue.push(new Transaction(transaction))
    }
  }

  async addTransactions (transactions) {
    if (this.isConnected) {
      this.queue.push(transactions.map(tx => new Transaction(tx)))
    } else {
      logger.debug('Transactions not added to the transaction pool. Redis is not connected.')
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
    this.addTransactions(block.transactions.map(tx => tx.data))
  }

  __getRedisTransactionKey (id) {
    return `${this.keyPrefix}/tx/${id}`
  }

  __getRedisOrderKey () {
    return `${this.keyPrefix}/order`
  }

  // rebuildBlockHeader (block) {

  // }
}
