'use strict'

const Promise = require('bluebird')
const Sequelize = require('sequelize')
const { TransactionPoolInterface } = require('@arkecosystem/core-transaction-pool')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = require('./database/index')
const ark = require('@arkecosystem/crypto')
const { Transaction } = ark.models

module.exports = class TransactionPool extends TransactionPoolInterface {
  /**
   * Make the transaction pool instance.
   * @return {TransactionPool}
   */
  async make () {
    if (!this.options.enabled) {
      logger.warn('SQLite transaction pool disabled')
      return this
    }

    this.pool = await database.setUp(this.options.database)
    this.__checkForExpiredTransactions()
    return this
  }

  async getPoolSize () {
    return this.pool.model.count()
  }

  /**
   * Add a transaction to the pool.
   * @param {(Transaction|void)} transaction
   */
  async addTransaction (transaction) {
    if (!(transaction instanceof Transaction)) {
      return logger.warn(`Discarded Transaction ${transaction} - Invalid object.`)
    }

    if (await this.pool.transactionExists(transaction.id)) {
      return logger.debug(`Duplicated Transaction ${transaction.id} - Transaction already in pool.`)
    }

    try {
      let res = await this.pool.add({
        id: transaction.id,
        serialized: transaction.serialized.toString('hex'),
        senderPublicKey: transaction.senderPublicKey,
        timestamp: transaction.timestamp,
        expiration: transaction.expiration
      })

      if (res === 0) {
        throw new Error('Transaction not added to the pool - await this.pool.hmset failed')
      }
    } catch (error) {
      logger.error('Could not add transaction to SQLite', error, error.stack)

      this.walletManager.revertTransaction(transaction)
    }
  }

  async addTransactions (transactions) {
    return Promise.each(transactions, async (transaction) => {
      await this.addTransaction(transaction)
    })
  }

  /**
   * Get a transaction by transaction id.
   * @param  {Number} id
   * @return {(Transaction|String|void)}
   */
  async getTransaction (id) {
    const transaction = await this.pool.findById(id)
    if (transaction) {
      return Transaction.fromBytes(transaction.serialized)
    }

    return undefined
  }

  /**
   * Get all transactions within the specified range.
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)}
   */
  async getTransactions (start, size) {
    return this.pool.model.findAll({
      order: Sequelize.col('created_at'),
      offset: start,
      limit: size
    })
  }

  async getTransactionsIds (start, size) {
    const transactions = await this.pool.model.findAll({
      order: Sequelize.col('created_at'),
      offset: start,
      limit: size,
      attributes: ['id']
    })
    return transactions.map(transaction => transaction.id)
  }

  async removeTransaction (transaction) {
    return this.pool.deleteById(transaction.id)
  }

  async removeTransactionById (ids) {
    return this.pool.deleteById(ids)
  }

  async removeTransactions (transactions) {
    return this.removeTransactionById(transactions.map(transaction => transaction.id))
  }

  /**
   * Remove all transactions from transaction pool belonging to specific sender
   * @param  {String} senderPublicKey
   * @return {void}
   */
  async removeTransactionsForSender (senderPublicKey) {
    return this.pool.deleteBySender(senderPublicKey)
  }

  async getSenderSize (senderPublicKey) {
    return this.pool.getSenderSize(senderPublicKey)
  }

  /**
   * Check whether sender of transaction has exceeded max transactions in queue.
   * @param  {String} transaction
   * @return {(Boolean|void)}
   */
  async hasExceededMaxTransactions (transaction) {
    if (this.options.allowedSenders.includes(transaction.senderPublicKey)) {
      logger.debug(`Transaction pool allowing ${transaction.senderPublicKey} senderPublicKey, thus skipping throttling.`)
      return false
    }

    const count = await this.getSenderSize(transaction.senderPublicKey)
    return count ? count >= this.options.maxTransactionsPerSender : false
  }

  async __checkForExpiredTransactions () {
    setTimeout(async () => {
      if (this.pool) {
        const transactionIds = await this.pool.getExpiredTransactionIds()
        if (transactionIds.length) {
          logger.debug(`Received ${transactionIds.length} expired transactions. Removing them`)
          await this.removeTransactionById(transactionIds)
        }
      }
      this.__checkForExpiredTransactions()
    }, 1000)
  }
}
