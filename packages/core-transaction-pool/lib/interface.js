'use strict'

const container = require('@arkecosystem/core-container')
const TransactionGuard = require('./guard')

module.exports = class TransactionPoolInterface {
  /**
   * Create a new transaction pool instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.options = options
    this.guard = new TransactionGuard(this)
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
   * Add a transaction to the pool.
   * @param {Transaction} transaction
   */
  async addTransaction (transaction) {
    throw new Error('Method [addTransaction] not implemented!')
  }

  /**
   * Remove a transaction from the pool by transaction object.
   * @param  {Transaction} transaction
   * @return {void}
   */
  async removeTransaction (transaction) {
    throw new Error('Method [removeTransaction] not implemented!')
  }

  /**
   * Remove a transaction from the pool by id.
   * @param  {Number} id
   * @return {void}
   */
  async removeTransactionById (id) {
    throw new Error('Method [removeTransactionById] not implemented!')
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
    throw new Error('Method [addTransactions] not implemented!')
  }

  /**
   * Check whether sender of transaction has exceeded max transactions in queue.
   * @param  {String} address
   * @return {(Boolean|void)}
   */
  async hasExceededMaxTransactions (transaction) {
    throw new Error('Method [hasExceededMaxTransactions] not implemented!')
  }

  /**
   * Check whether ransaction is already in pool
   * @param  {transaction} transaction
   * @return {Boolean}
   */
  async transactionExists (transaction) {
    throw new Error('Method [transactionExists] not implemented!')
  }

  /**
   * Get a sender public key by transaction id.
   * @param  {Transactions[]} transactions
   * @return {Object}
   */
  async determineExcessTransactions (transactions) {
    const response = {
      accept: [],
      excess: []
    }

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]

      await this.hasExceededMaxTransactions(transaction)
        ? response.excess.push(transaction)
        : response.accept.push(transaction)
    }

    return response
  }

  /**
   * Removes any transactions in the pool that have already been forged.
   * Returns IDs of pending transactions that have yet to be forged.
   * @param  {Array} transactionIds
   * @return {Array}
   */
  async removeForgedAndGetPending (transactionIds) {
    const forgedIds = await container.resolvePlugin('blockchain').database.getForgedTransactionsIds(transactionIds)
    forgedIds.forEach(element => this.removeTransactionById(element))

    return transactionIds.filter(id => forgedIds.indexOf(id) === -1)
  }
}
