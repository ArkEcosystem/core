'use strict';
const pluginManager = require('@arkecosystem/core-plugin-manager')
const blockchainManager = pluginManager.get('blockchain')
const async = require('async')
const logger = pluginManager.get('logger')
const client = require('@arkecosystem/client')
const { Transaction, slots } = client

module.exports = class TransactionPoolInterface {
  /**
   * Create a new transaction pool instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.options = options

    const that = this
    this.queue = async.queue((transaction, qcallback) => {
      if (that.verify(transaction)) {
        that.addTransactionToPool(transaction)
      }
      qcallback()
    }, 1)

    if (!this.options.enabled) {
      logger.warn('Transaction Pool is disabled! If this node runs in production please enable it.')
    }
  }

  /**
   * Get a driver instance.
   * @return {TransactionPoolInterface}
   */
  driver () {
    return this.driver
  }

  /**
   * Add transaction to the registered pool. Is called from blockchainManager
   * @param {Array} transactions
   */
  async addTransactions (transactions) {
    this.queue.push(transactions.map(tx => {
      let transaction = new Transaction(tx)

      // TODO for TESTING - REMOVE LATER ON expiration and time lock testing remove from production
      if (process.env.ARK_ENV === 'testnet') {
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
   * Add the given transaction to the redis pool.
   * @param {Transaction} transaction
   */
  async addTransactionToPool (transaction) {
    if (this.driver) {
      await this.addTransaction(transaction)
    }
  }

  /**
   * Checks if any of transactions for forging from pool was already forged and removes them from pool
   * It returns only the ids of transactions that have yet to be forged
   * @param  {Array} transactionIds
   * @return {Array}
   */
  async CheckIfForged (transactionIds) {
    const forgedIds = await blockchainManager.getDatabaseConnection().getForgedTransactionsIds(transactionIds)
    forgedIds.forEach(element => this.removeTransaction(element))
    return transactionIds.filter(id => forgedIds.indexOf(id) === -1)
  }

  async getPoolSize () {
    throw new Error('Method [getPoolSize] not implemented!')
  }

  async addTransaction (transaction) {
    throw new Error('Method [addTransaction (transaction)] not implemented!')
  }

  async removeTransaction (id) {
    throw new Error('Method [removeTransaction (id)] not implemented!')
  }

  async removeTransactions (transactions) {
    throw new Error('Method [removeTransactions (transactions)] not implemented!')
  }

  async getTransaction (id) {
    throw new Error('Method [getTransaction (id)] not implemented!')
  }

  async getTransactions (start, size) {
    throw new Error('Method [getTransactions (start,size)] not implemented!')
  }

  async getTransactionsForForging (start, size) {
    throw new Error('Method [getTransactionsForForging (start, size)] not implemented!')
  }
}
