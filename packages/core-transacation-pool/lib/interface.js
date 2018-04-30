'use strict';
const pluginManager = require('@arkecosystem/core-plugin-manager')
const blockchainManager = pluginManager.get('blockchain')

module.exports = class TransactionPoolInterface {
  /**
   * Create a new transaction pool instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.options = options
  }

  /**
   * Get a driver instance.
   * @return {TransactionPoolInterface}
   */
  driver () {
    return this.driver
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
