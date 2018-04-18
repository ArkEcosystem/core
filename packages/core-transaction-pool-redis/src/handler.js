'use strict';

const async = require('async')
const { Transaction } = require('@arkecosystem/client').models
const { crypto, slots } = require('@arkecosystem/client')
const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')
const blockchainManager = pluginManager.get('blockchain')
const TransactionPoolManager = require('./manager')

let instance

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class Handler {
  /**
   * [getInstance description]
   * @return {[type]} [description]
   */
  static getInstance () {
    return instance
  }

  /**
   * [constructor description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  constructor (config) {
    this.walletManager = blockchainManager.getDatabaseConnection().walletManager
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
      logger.warning('Transaction Pool is disabled! If this node runs in production please enable it.')
    }
    return instance
  }

  /**
   * [addTransaction description]
   * @param {[type]} transaction [description]
   */
  async addTransaction (transaction) {
    if (this.poolManager) {
      this.queue.push(new Transaction(transaction))
    }
  }

  /**
   * [addTransactions description]
   * @param {[type]} transactions [description]
   */
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
          transaction.data.timelock = blockchainManager.getState().lastBlock.data.height + Math.floor(Math.random() * Math.floor(20) + 1)
        }
      }
      return transaction
    }))
  }

  /**
   * [verify description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  verify (transaction) {
    const wallet = this.walletManager.getWalletByPublicKey(transaction.senderPublicKey)
    if (crypto.verify(transaction) && wallet.canApply(transaction)) {
      this.walletManager.applyTransaction(transaction)
      return true
    }
  }

  /**
   * [undoBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  async undoBlock (block) { // we add back the block txs to the pool
    if (block.transactions.length === 0) return
    // no return the main thread is liberated
    this.addTransactions(block.transactions.map(tx => tx.data))
  }

  /**
   * [addTransactionToRedis description]
   * @param {[type]} object [description]
   */
  async addTransactionToRedis (object) {
    if (this.poolManager) {
      await this.poolManager.addTransaction(object)
    }
  }

  /**
   * [removeForgedTransactions description]
   * @param  {[type]} transactions [description]
   * @return {[type]}              [description]
   */
  async removeForgedTransactions (transactions) { // we remove the txs from the pool
    if (this.poolManager) {
      await this.poolManager.removeTransactions(transactions)
    }
  }

  /**
   * [getUnconfirmedTransactions description]
   * @param  {[type]} start [description]
   * @param  {[type]} size  [description]
   * @return {[type]}       [description]
   */
  async getUnconfirmedTransactions (start, size) {
    return this.poolManager.getTransactions(start, size)
  }

  /**
   * [getTransactionsForForging description]
   * @param  {[type]} start [description]
   * @param  {[type]} size  [description]
   * @return {[type]}       [description]
   */
  async getTransactionsForForging (start, size) {
    return this.poolManager.getTransactionsForForging(start, size)
  }

  /**
   * [getUnconfirmedTransaction description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  async getUnconfirmedTransaction (id) {
    return this.poolManager.getTransaction(id)
  }

  /**
   * [getPoolSize description]
   * @return {[type]} [description]
   */
  async getPoolSize () {
    return this.poolManager.getPoolSize()
  }

  // rebuildBlockHeader (block) {

  // }
}
