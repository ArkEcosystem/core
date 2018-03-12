const Redis = require('ioredis')
const logger = require('app/core/logger')
const Transaction = require('app/models/transaction')
const arkjs = require('arkjs')
const async = require('async')
const BlockchainManager = require('app/core/managers/blockchain')
const webhookManager = require('app/core/managers/webhook')

let instance = null

module.exports = class TransactionPool {
  constructor (config) {
    this.isConnected = false
    this.redis = config.server.txpool.enabled ? new Redis(config.server.txpool.port, config.server.txpool.host) : null
    this.key = config.server.txpool.key
    this.db = BlockchainManager.getInstance().getDb()
    this.config = config

    if (this.redis) {
      this.redis.on('connect', () => {
        logger.info('Redis connection established.')
        this.isConnected = true
      })
    }

    const that = this
    this.queue = async.queue((transaction, qcallback) => {
      if (that.verify(transaction)) {
        // for expiration testing
        if (config.server.test) transaction.data.expiration = arkjs.slots.getTime() + Math.floor(Math.random() * Math.floor(200))
        that.add(transaction)
      }
      qcallback()
    }, 1)

    if (!instance) {
      instance = this
    }

    logger.info(`Transaction pool initialized with connection status ${this.isConnected}`)
    if (!config.server.txpool.enabled) {
      logger.warn('Transaction pool IS DISABLED')
    }
    return instance
  }

  static getInstance () {
    return instance
  }

  async size () {
    return this.isConnected ? this.redis.llen(this.key) : -1
  }

  async removeForgedTransactions (blockTransactions) {
    if (this.isConnected) {
      try {
        for (let tx of blockTransactions) {
          const serialized = await this.redis.hget(`${this.key}/tx/${tx.id}`, 'serialized')
          logger.debug(`Removing forged transaction ${tx.id} from redis pool`)
          let x = this.redis.lrem(this.key, 1, serialized)
          if (x < 1) {
            logger.warn(`Removing failed, transaction not found in pool with key:${this.key} tx:${serialized} TX_JSON:${JSON.stringify(tx)}`)
          }
          await this.redis.del(`${this.key}/tx/${tx.id}`)
          await this.redis.del(`${this.key}/tx/expiration/${tx.id}`)
        }
      } catch (error) {
        logger.error('Error removing forged transactions from pool', error.stack)
      }
    }
  }

  async add (object) {
    if (this.isConnected && object instanceof Transaction) {
      try {
        logger.debug(`Adding transaction ${object.id} to redis pool`)
        await this.redis.hset(`${this.key}/tx/${object.id}`, 'serialized', object.serialized.toString('hex'), 'timestamp', object.data.timestamp, 'expiration', object.data.expiration)
        await this.redis.rpush(this.key, object.serialized.toString('hex'))
        // logger.warn(JSON.stringify(object.data))
        if (object.data.expiration > 0) {
          logger.debug(`Received transaction ${object.id} with expiration ${object.data.expiration}`)
          await this.redis.hset(`${this.key}/tx/expiration/${object.id}`, 'id', object.id, 'serialized', object.serialized.toString('hex'), 'timestamp', object.data.timestamp, 'expiration', object.data.expiration)
        }
      } catch (error) {
        logger.error('Rpush tx to txpool error:', error.stack)
      }
    }
  }

  async getUnconfirmedTransactions (start, size) {
    if (this.isConnected) {
      try {
        return this.redis.lrange(this.key, start, start + size - 1)
      } catch (error) {
        logger.error('Get serialized items from redis list: ', error.stack)
      }
    }
  }

  async getUnconfirmedTransaction (id) {
    if (this.isConnected) {
      const serialized = await this.redis.hget(`${this.key}/tx/${id}`, 'serialized')

      return Transaction.fromBytes(serialized)
    }
  }

  async cleanPool (currentTimestamp) {
    if (this.isConnected) {
      const items = await this.redis.keys(`${this.key}/tx/expiration/*`)
      for (const key of items) {
        const txDetails = await this.redis.hmget(key, 'id', 'serialized', 'timestamp', 'expiration')
        const expiration = parseInt(txDetails[3])
        if (expiration <= currentTimestamp) {
          logger.debug(`Removing expired transaction ${key}, expirationTime:${expiration} actualTime:${currentTimestamp}`)
          await this.redis.lrem(this.key, 1, txDetails[1])
          await this.redis.del(`${this.key}/tx/${txDetails[0]}`)
          await this.redis.del(`${this.key}/tx/expiration/${txDetails[0]}`)
          // this needs to emit a serialized transaction
          // webhookManager.getInstance().emit('transaction.expired', txDetails.serialzed)
        }
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

  async removeForgedBlock (block) { // we remove the block txs from the pool
    if (this.isConnected) {
      await this.removeForgedTransactions(block.transactions)
      await this.cleanPool(arkjs.slots.getTime()) // we check for expiration of transactions and clean them
      block.transactions.foreach(tx => webhookManager.getInstance().emit('transaction.removed', tx))
    }
  }

  async undoBlock (block) { // we add back the block txs to the pool
    if (block.transactions.length === 0) return
    // no return the main thread is liberated
    this.addTransactions(block.transactions.map(tx => tx.data))
  }

  // rebuildBlockHeader (block) {

  // }
}
