'use strict'

const Promise = require('bluebird')

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')

const ark = require('@arkecosystem/crypto')
const { slots } = ark
const { TRANSACTION_TYPES } = ark.constants

const memory = require('./memory')
const PoolWalletManager = require('./pool-wallet-manager')
const helpers = require('./utils/validation-helpers')
const moment = require('moment')
const uniq = require('lodash/uniq')

module.exports = class TransactionPoolInterface {
  /**
   * Create a new transaction pool instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.options = options
    this.walletManager = new PoolWalletManager()
    this.memory = memory

    this.blockedByPublicKey = {}
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
   * Get the number of transaction in the pool from specific sender
   * @param  {String} senderPublicKey
   * @return {Number}
   */
  async getSenderSize (senderPublicKey) {
    throw new Error('Method [getSenderSize] not implemented!')
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
   * Get all transactions IDs within the specified range.
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array}
   */
  async getTransactionsIds (start, size) {
    throw new Error('Method [getTransactionsIds] not implemented!')
  }

  /**
   * Remove all transactions from transaction pool belonging to specific sender
   * @param  {String} senderPublicKey
   * @return {void}
   */
  async removeTransactionsForSender (senderPublicKey) {
    throw new Error('Method [removeTransactionsForSender] not implemented!')
  }

  /**
   * Add many transaction to the pool. Method called from blockchain, upon receiving payload.
   * @param {Array}   transactions
   * @param {Boolean} isBroadcast
   */
  async addTransactions (transactions, isBroadcast) {
    throw new Error('Method [addTransactions] not implemented!')
  }

  /**
   * Check whether sender of transaction has exceeded max transactions in queue.
   * @param  {String} transaction
   * @return {(Boolean|void)}
   */
  async hasExceededMaxTransactions (transaction) {
    throw new Error('Method [hasExceededMaxTransactions] not implemented!')
  }

  /**
   * Check whether transaction is already in pool
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  async transactionExists (transaction) {
    throw new Error('Method [transactionExists] not implemented!')
  }

  /**
   * Check if transaction sender is blocked
   * @param  {String} senderPublicKey
   * @return {Boolean}
   */
  isSenderBlocked (senderPublicKey) {
    if (!this.blockedByPublicKey[senderPublicKey]) {
      return false
    }

    if (this.blockedByPublicKey[senderPublicKey] < moment()) {
      delete this.blockedByPublicKey[senderPublicKey]
      return false
    }

    return true
  }

  /**
   * Blocks sender for a specified time
   * @param  {String} senderPublicKey
   * @return {Time} blockReleaseTime
   */
  blockSender (senderPublicKey) {
    const blockReleaseTime = moment().add(1, 'hours')

    this.blockedByPublicKey[senderPublicKey] = blockReleaseTime

    logger.warn(`Sender ${senderPublicKey} blocked until ${this.blockedByPublicKey[senderPublicKey]} :stopwatch:`)

    return blockReleaseTime
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)}
   */
  async getTransactionsForForging (start, size) {
    try {
      let transactionIds = await this.getTransactionsIds(start, size)
      transactionIds = await this.removeForgedAndGetPending(transactionIds)
      transactionIds = uniq(transactionIds)

      let transactions = []
      for (const id of transactionIds) {
        const transaction = await this.getTransaction(id)

        if (!transaction) {
          continue
        }

        if (!helpers.canApplyToBlockchain(transaction)) {
          await this.removeTransaction(transaction)

          logger.debug(`Unsufficient funds for transaction ${id}. Possible double spending attack :bomb:`)

          await this.purgeByPublicKey(transaction.senderPublicKey)
          this.blockSender(transaction.senderPublicKey)

          continue
        }

        if (transaction.type === TRANSACTION_TYPES.TIMELOCK_TRANSFER) { // timelock is defined
          const actions = {
            0: () => { // timestamp lock defined
              if (transaction.timelock <= slots.getTime()) {
                logger.debug(`Timelock for ${id} released - timestamp: ${transaction.timelock} :unlock:`)
                transactions.push(transaction.serialized.toString('hex'))
              }
            },
            1: () => { // block height time lock
              if (transaction.timelock <= container.resolvePlugin('blockchain').getLastBlock().data.height) {
                logger.debug(`Timelock for ${id} released - block height: ${transaction.timelock} :unlock:`)
                transactions.push(transaction.serialized.toString('hex'))
              }
            }
          }
          actions[transaction.timelockType]()
        } else {
          transactions.push(transaction.serialized.toString('hex'))
        }
      }

      return transactions
    } catch (error) {
      logger.error('Could not get transactions for forging from Redis: ', error, error.stack)
    }
  }

  /**
   * Removes any transactions in the pool that have already been forged.
   * @param  {Array} transactionIds
   * @return {Array} IDs of pending transactions that have yet to be forged.
   */
  async removeForgedAndGetPending (transactionIds) {
    const forgedIdsSet = new Set(await database.getForgedTransactionsIds(transactionIds))

    await Promise.each(forgedIdsSet, async (transactionId) => {
      await this.removeTransactionById(transactionId)
    })

    return transactionIds.filter(id => !forgedIdsSet.has(id))
  }

  /**
   * Processes recently accepted block by the blockchain.
   * It removes block transaction from the pool and adjusts pool wallets for non existing transactions
   *
   * @param  {Object} block
   * @return {void}
   */
  async acceptChainedBlock (block) {
    for (const transaction of block.transactions) {
      const exists = await this.transactionExists(transaction.id)
      if (!exists) {
        const senderWallet = this.walletManager.exists(transaction.senderPublicKey) ? this.walletManager.getWalletByPublicKey(transaction.senderPublicKey) : false
        // if wallet in pool we try to apply transaction
        if (senderWallet || this.walletManager.exists(transaction.recipientId)) {
          try {
            await this.walletManager.applyPoolTransaction(transaction)
          } catch (error) {
            logger.error(`AcceptChainedBlock in pool: ${error}`)
            await this.purgeByPublicKey(transaction.senderPublicKey)
            this.blockSender(transaction.senderPublicKey)
          }

          if (senderWallet.balance === 0) {
            this.walletManager.deleteWallet(transaction.senderPublicKey)
          }
        }
      } else {
        await this.removeTransaction(transaction)
      }

      if (await this.getSenderSize(transaction.senderPublicKey) === 0) {
        this.walletManager.deleteWallet(transaction.senderPublicKey)
      }
    }

    this.walletManager.applyPoolBlock(block)
  }

  /**
   * Rebuild pool manager wallets
   * Removes all the wallets from pool manager and applies transaction from pool - if any
   * It waits for the node to sync, and then check the transactions in pool and validates them and apply to the pool manager
   * @return {void}
   */
  async buildWallets () {
    this.walletManager.purgeAll()
    const poolTransactions = await this.getTransactionsIds(0, 0)

    const unconfirmedTransactions = await this.removeForgedAndGetPending(poolTransactions)

    await Promise.each(unconfirmedTransactions, async (transactionId) => {
      const transaction = await this.getTransaction(transactionId)

      if (!transaction) {
        return
      }

      try {
        await this.walletManager.applyPoolTransaction(transaction)
      } catch (error) {
        logger.error('BuildWallets from pool:', error)
        await this.purgeByPublicKey(transaction.senderPublicKey)
      }
    })
    logger.info('Transaction Pool Manager build wallets complete')
  }

  async purgeByPublicKey (senderPublicKey) {
    logger.debug(`Purging sender: ${senderPublicKey} from pool wallet manager`)

    await this.removeTransactionsForSender(senderPublicKey)

    this.walletManager.deleteWallet(senderPublicKey)
  }
}
