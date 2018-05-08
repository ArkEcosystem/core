'use strict'
const container = require('@arkecosystem/core-container')
const blockchain = container.resolvePlugin('blockchain')
const p2p = container.resolvePlugin('p2p')
const async = require('async')
const logger = container.resolvePlugin('logger')
const client = require('@arkecosystem/client')
const { crypto } = client
// const { slots, crypto } = client
const { Transaction } = client.models

module.exports = class TransactionPoolInterface {
  /**
   * Create a new transaction pool instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.options = options
    this.walletManager = blockchain.database.walletManager

    if (!this.options.enabled) {
      logger.warn('Transaction pool is disabled - please enable if run in production')

      return
    }

    this.queue = async.queue((transaction, queueCallback) => {
      if (this.verifyTransaction(transaction)) {
        this.addTransaction(transaction)
        if (!transaction.isBroadcast) {
          this.broadcastTransaction(transaction)
        }
      }
      queueCallback()
    }, 1)
  }

  /**
   * Get a driver instance.
   * @return {TransactionPoolInterface}
   */
  driver () {
    return this.driver
  }

   /**
   * Get the number of transactions in the pool.
   * @return {Number}
   */
  async getPoolSize () {
    throw new Error('Method [getPoolSize] not implemented!')
  }

  /**
   * Broadcast transaction to additional peers.
   * @param {Transaction} transaction
   */
  async broadcastTransaction (transaction) {
    p2p.broadcastTransactions([transaction])
  }

  /**
   * Add a transaction to the pool.
   * @param {Transaction} transaction
   */
  async addTransaction (transaction) {
    if (this.driver) {
      await this.addTransaction(transaction)
    }
  }

  /**
   * Remove a transaction from the pool.
   * @param  {Number} id
   * @return {void}
   */
  async removeTransaction (id) {
    throw new Error('Method [removeTransaction] not implemented!')
  }

  /**
   * Remove multiple transactions from the pool.
   * @param  {Array} transactions
   * @return {void}
   */
  async removeTransactions (transactions) {
    throw new Error('Method [removeTransactions] not implemented!')
  }

  /**
   * Get a transaction from the pool by transaction id.
   * @param  {Number} id
   * @return {(Transaction|String)}
   */
  async getTransaction (id) {
    throw new Error('Method [getTransaction] not implemented!')
  }

  /**
   * Get all transactions within the specified range.
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array}
   */
  async getTransactions (start, size) {
    throw new Error('Method [getTransactions] not implemented!')
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array}
   */
  async getTransactionsForForging (start, size) {
    throw new Error('Method [getTransactionsForForging] not implemented!')
  }

  /**
   * Add many transaction to the pool. Method called from blockchain, upon receiveing payload.
   * @param {Array}   transactions
   * @param {Boolean} isBroadcast
   */
  async addTransactions (transactions, isBroadcast) {
    this.queue.push(transactions.map(tx => {
      let transaction = new Transaction(tx)
      transaction.isBroadcast = isBroadcast

      // TODO: for TESTING - REMOVE LATER ON expiration and time lock testing remove from production
      // if (process.env.ARK_ENV === 'test') {
      //   const current = slots.getTime()
      //   transaction.data.expiration = current + Math.floor(Math.random() * Math.floor(1000) + 1)

      //   if (Math.round(Math.random() * Math.floor(1)) === 0) {
      //     transaction.data.timelocktype = 0 // timestamp
      //     transaction.data.timelock = current + Math.floor(Math.random() * Math.floor(50) + 1)
      //   } else {
      //     transaction.data.timelocktype = 1 // block
      //     transaction.data.timelock = blockchain.getLastBlock(true).height + Math.floor(Math.random() * Math.floor(20) + 1)
      //   }
      // }

      return transaction
    }))
  }

  /**
   * Removes any transactions in the pool that have already been forged.
   * Returns IDs of pending transactions that have yet to be forged.
   * @param  {Array} transactionIds
   * @return {Array}
   */
  async removeForgedAndGetPending (transactionIds) {
    const forgedIds = await blockchain.database.getForgedTransactionsIds(transactionIds)
    forgedIds.forEach(element => this.removeTransaction(element))

    return transactionIds.filter(id => forgedIds.indexOf(id) === -1)
  }

  /**
   * Verify the given transaction.
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  verifyTransaction (transaction) {
    const wallet = this.walletManager.getWalletByPublicKey(transaction.senderPublicKey)

    return crypto.verify(transaction) && wallet.canApply(transaction)
  }
}
