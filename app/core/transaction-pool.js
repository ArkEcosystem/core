const Redis = require('ioredis')
const logger = require('app/core/logger')
const Transaction = require('app/models/transaction')
const arkjs = require('arkjs')
const async = require('async')
const BlockchainManager = require('app/core/managers/blockchain')

let instance = null
module.exports = class TransactionPool {
  constructor (config) {
    this.redis = config.server.txpool ? new Redis(config.server.txpool.port, config.server.txpool.host) : new Redis()
    this.key = config.server.txpool ? config.server.txpool.key : 'ark/pool'
    this.db = BlockchainManager.getInstance().getDb()
    this.config = config

    const that = this
    this.queue = async.queue((transaction, qcallback) => {
      if (that.verify(transaction)) {
        // for expiration testing
        // if (config.server.test) transaction.data.expiration = Math.floor(Math.random() * Math.floor(200));
        that.add(transaction)
      }
      qcallback()
    }, 1)

    if (!instance) {
      instance = this
    }
    logger.info('Transaction pool initialized')
    return instance
  }

  static getInstance () {
    return instance
  }

  async size () {
    return this.redis.llen(this.key)
  }

  async removeForgedTransactions (blockTransactions) {
    try {
      for (let tx of blockTransactions) {
        const serialized = await this.redis.hget(`${this.key}/tx/${tx.id}`, 'serialized')
        logger.debug(`Removing transaction ${tx.id} from redis pool`)
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

  async add (object) {
    if (object instanceof Transaction) {
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

  getItems (blockSize) {
    try {
      return this.redis.lrange(this.key, 0, blockSize - 1)
    } catch (error) {
      logger.error('Get serialized items from redis list: ', error.stack)
    }
  }

  async cleanPool (currentTimestamp, blockTime) {
    const items = await this.redis.keys(`${this.key}/tx/expiration/*`)
    for (const key of items) {
      const txDetails = await this.redis.hmget(key, 'id', 'serialized', 'timestamp', 'expiration')
      const expiration = parseInt(txDetails[2]) + (parseInt(txDetails[3]) * blockTime)
      if (expiration <= currentTimestamp) {
        logger.debug(`Removing expired transaction ${key}, expirationTime:${expiration} actualTime:${currentTimestamp}`)
        await this.redis.lrem(this.key, 1, txDetails[1])
        await this.redis.del(`${this.key}/tx/${txDetails[0]}`)
        await this.redis.del(`${this.key}/tx/expiration/${txDetails[0]}`)
      }
    }
  }

  async addTransaction (transaction) {
    this.queue.push(new Transaction(transaction))
  }

  async addTransactions (transactions) {
    this.queue.push(transactions.map(tx => new Transaction(tx)))
  }

  verify (transaction) {
    const wallet = this.db.walletManager.getWalletByPublicKey(transaction.senderPublicKey)
    if (arkjs.crypto.verify(transaction) && wallet.canApply(transaction)) {
      this.db.walletManager.applyTransaction(transaction)
      return true
    }
  }

  async addBlock (block) { // we remove the block txs from the pool
    await this.db.walletManager.applyBlock(block)
    await this.removeForgedTransactions(block.transactions)
    await this.cleanPool(block.data.timestamp, this.config.getConstants(block.data.height).blocktime)
  }

  async undoBlock (block) { // we add back the block txs to the pool
    if (block.transactions.length === 0) return
    // no return the main thread is liberated
    this.addTransactions(block.transactions.map(tx => tx.data))
  }

  async getTransactions (blockSize) {
    let retItems = await this.pool.getItems(blockSize)
    console.log(retItems)
    return {
      transactions: retItems,
      poolSize: this.size,
      count: retItems.length
    }
  }

  // rebuildBlockHeader (block) {

  // }
}
