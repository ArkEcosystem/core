'use strict'

const container = require('@arkecosystem/core-container')
const TransactionGuard = require('./guard')
const logger = container.resolvePlugin('logger')

const ark = require('@arkecosystem/crypto')
const { slots } = ark
const { TRANSACTION_TYPES } = ark.constants

const PoolWalletManager = require('./pool-wallet-manager')
const helpers = require('./utils/wallet-helpers')

module.exports = class TransactionPoolInterface {
  /**
   * Create a new transaction pool instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.options = options
    this.walletManager = new PoolWalletManager()
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
  async purgeSender (senderPublicKey) {
    throw new Error('Method [purgeSender] not implemented!')
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
   * Get all transactions that are ready to be forged.
   * @param  {Number} start
   * @param  {Number} size
   * @return {(Array|void)}
   */
  async getTransactionsForForging (start, size) {
    try {
      let transactionIds = await this.getTransactionsIds(start, size)
      transactionIds = await this.removeForgedAndGetPending(transactionIds)

      let transactions = []
      for (const id of transactionIds) {
        const transaction = await this.getTransaction(id)

        if (!helpers.canApplyToBlockchain(transaction)) {
          await this.removeTransaction(transaction)
          logger.debug(`Possible double spending attack/unsufficient funds for transaction ${id}`)
          continue
        }

        if (transaction.type === TRANSACTION_TYPES.TIMELOCK_TRANSFER) { // timelock is defined
          const actions = {
            0: () => { // timestamp lock defined
              if (transaction.timelock <= slots.getTime()) {
                logger.debug(`Timelock for ${id} released - timestamp: ${transaction.timelock}`)
                transactions.push(transaction.serialized.toString('hex'))
              }
            },
            1: () => { // block height time lock
              if (transaction.timelock <= container.resolvePlugin('blockchain').getLastBlock(true).height) {
                logger.debug(`Timelock for ${id} released - block height: ${transaction.timelock}`)
                transactions.push(transaction.serialized.toString('hex'))
              }
            }
          }
          actions[transaction.timelocktype]()
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
   * Returns IDs of pending transactions that have yet to be forged.
   * @param  {Array} transactionIds
   * @return {Array}
   */
  async removeForgedAndGetPending (transactionIds) {
    const forgedIds = await container.resolvePlugin('blockchain').database.getForgedTransactionsIds(transactionIds)
    forgedIds.forEach(element => this.removeTransactionById(element))

    return transactionIds.filter(id => forgedIds.indexOf(id) === -1)
  }

  /**
   * Processes recently accepted block by the blockchain.
   * @param  {Object} block
   * @return {void}
   */
  async acceptChainedBlock (block) {
    this.walletManager.applyBlock(block)

    block.transactions.forEach(transaction => {
      // there are other transactions from this sender - wallet exists in pool wallet manager
      // the forged transaction is not in pool - so needs to be applied
      // we must apply the transaction also to this sender/recepient in pool wallet manager
      if (this.walletManager.exists(transaction.senderPublicKey) && !this.pool.transactionExists(transaction)) {
        try {
          this.walletManager.applyTransaction(transaction) // apply as it was already applied on BC wallet manager
        } catch (error) {
          // remove sender from the pool, i.e. not enough funds
          logger.error(`Purging ${transaction.senderPublicKey} from pool. Not enough funds, possible double spending.`)
          this.purgeSender(transaction.senderPublicKey)
          this.walletManager.deleteWallet(transaction.senderPublicKey)
        }
      }
    })

    await this.removeTransactions(block.transactions)
  }
}
