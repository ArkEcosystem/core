const app = require('@arkecosystem/core-container')

const logger = app.resolvePlugin('logger')

const dayjs = require('dayjs-ext')
const PoolWalletManager = require('./pool-wallet-manager')

const database = app.resolvePlugin('database')
const dynamicFeeMatch = require('./utils/dynamicfee-matcher')

module.exports = class TransactionPoolInterface {
  /**
   * Create a new transaction pool instance.
   * @param  {Object} options
   */
  constructor(options) {
    this.options = options
    this.walletManager = new PoolWalletManager()

    this.blockedByPublicKey = {}
  }

  /**
   * Get a driver instance.
   * @return {TransactionPoolInterface}
   */
  driver() {
    return this.driver
  }

  /**
   * Disconnect from transaction pool.
   * @return {void}
   */
  disconnect() {
    throw new Error('Method [disconnect] not implemented!')
  }

  /**
   * Get the number of transactions in the pool.
   * @return {Number}
   */
  getPoolSize() {
    throw new Error('Method [getPoolSize] not implemented!')
  }

  /**
   * Get the number of transaction in the pool from specific sender
   * @param  {String} senderPublicKey
   * @return {Number}
   */
  getSenderSize(senderPublicKey) {
    throw new Error('Method [getSenderSize] not implemented!')
  }

  /**
   * Add a transaction to the pool.
   * @param {Transaction} transaction
   */
  addTransaction(transaction) {
    throw new Error('Method [addTransaction] not implemented!')
  }

  /**
   * Remove a transaction from the pool by transaction object.
   * @param  {Transaction} transaction
   * @return {void}
   */
  removeTransaction(transaction) {
    throw new Error('Method [removeTransaction] not implemented!')
  }

  /**
   * Remove a transaction from the pool by id.
   * @param  {Number} id
   * @return {void}
   */
  removeTransactionById(id) {
    throw new Error('Method [removeTransactionById] not implemented!')
  }

  /**
   * Get all transactions that are ready to be forged.
   * @param  {Number} blockSize
   * @return {(Array|void)}
   */
  async getTransactionsForForging(blockSize) {
    throw new Error('Method [getTransactionsForForging] not implemented!')
  }

  /**
   * Get a transaction from the pool by transaction id.
   * @param  {Number} id
   * @return {(Transaction|String)}
   */
  getTransaction(id) {
    throw new Error('Method [getTransaction] not implemented!')
  }

  /**
   * Get all transactions within the specified range.
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array}
   */
  getTransactions(start, size) {
    throw new Error('Method [getTransactions] not implemented!')
  }

  /**
   * Get all cleans transactions IDs within the specified range from transaction pool.
   * @param  {Number} start
   * @param  {Number} size
   * @return {Array}
   */
  async getTransactionIdsForForging(start, size) {
    throw new Error('Method [getTransactionIdsForForging] not implemented!')
  }

  /**
   * Remove all transactions from transaction pool belonging to specific sender
   * @param  {String} senderPublicKey
   * @return {void}
   */
  removeTransactionsForSender(senderPublicKey) {
    throw new Error('Method [removeTransactionsForSender] not implemented!')
  }

  /**
   * Add many transaction to the pool. Method called from blockchain, upon receiving payload.
   * @param {Array}   transactions
   */
  addTransactions(transactions) {
    throw new Error('Method [addTransactions] not implemented!')
  }

  /**
   * Check whether sender of transaction has exceeded max transactions in queue.
   * @param  {String} transaction
   * @return {(Boolean|void)}
   */
  hasExceededMaxTransactions(transaction) {
    throw new Error('Method [hasExceededMaxTransactions] not implemented!')
  }

  /**
   * Check whether transaction is already in pool
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  transactionExists(transaction) {
    throw new Error('Method [transactionExists] not implemented!')
  }

  /**
   * Check if transaction sender is blocked
   * @param  {String} senderPublicKey
   * @return {Boolean}
   */
  isSenderBlocked(senderPublicKey) {
    if (!this.blockedByPublicKey[senderPublicKey]) {
      return false
    }

    if (this.blockedByPublicKey[senderPublicKey] < dayjs()) {
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
  blockSender(senderPublicKey) {
    const blockReleaseTime = dayjs().add(1, 'hours')

    this.blockedByPublicKey[senderPublicKey] = blockReleaseTime

    logger.warn(
      `Sender ${senderPublicKey} blocked until ${
        this.blockedByPublicKey[senderPublicKey]
      } :stopwatch:`,
    )

    return blockReleaseTime
  }

  /**
   * Processes recently accepted block by the blockchain.
   * It removes block transaction from the pool and adjusts
   * pool wallets for non existing transactions.
   *
   * @param  {Object} block
   * @return {void}
   */
  acceptChainedBlock(block) {
    for (const transaction of block.transactions) {
      const senderPublicKey = transaction.senderPublicKey

      const senderWallet = this.walletManager.exists(senderPublicKey)
        ? this.walletManager.findByPublicKey(senderPublicKey)
        : false

      const recipientWallet = this.walletManager.exists(transaction.recipientId)
        ? this.walletManager.findByAddress(transaction.recipientId)
        : false

      // If sender or recipient wallet in pool we try to apply transaction
      const exists = this.transactionExists(transaction.id)
      if (!exists && (senderWallet || recipientWallet)) {
        try {
          this.walletManager.applyPoolTransaction(transaction)
        } catch (error) {
          logger.error(`AcceptChainedBlock in pool: ${error}`)
          // Purge sender
          this.purgeByPublicKey(senderPublicKey)
        }
      } else {
        this.removeTransaction(transaction)
      }

      if (
        senderWallet &&
        senderWallet.balance === 0 &&
        this.getSenderSize(senderPublicKey) === 0
      ) {
        this.walletManager.deleteWallet(senderPublicKey)
      }
    }

    app
      .resolve('state')
      .removeCachedTransactionIds(block.transactions.map(tx => tx.id))

    this.walletManager.applyPoolBlock(block)
  }

  /**
   * Rebuild pool manager wallets
   * Removes all the wallets from pool manager and applies transaction from pool - if any
   * It waits for the node to sync, and then check the transactions in pool
   * and validates them and apply to the pool manager.
   * @return {void}
   */
  async buildWallets() {
    this.walletManager.reset()
    const poolTransactionIds = await this.getTransactionIdsForForging(
      0,
      this.getPoolSize(),
    )

    app.resolve('state').removeCachedTransactionIds(poolTransactionIds)

    poolTransactionIds.forEach(transactionId => {
      const transaction = this.getTransaction(transactionId)

      if (!transaction) {
        return
      }

      try {
        this.walletManager.applyPoolTransaction(transaction)
      } catch (error) {
        logger.error('BuildWallets from pool:', error)
        this.purgeByPublicKey(transaction.senderPublicKey)
      }
    })
    logger.info('Transaction Pool Manager build wallets complete')
  }

  purgeByPublicKey(senderPublicKey) {
    logger.debug(`Purging sender: ${senderPublicKey} from pool wallet manager`)

    this.removeTransactionsForSender(senderPublicKey)

    this.walletManager.deleteWallet(senderPublicKey)
  }

  /**
   * Purges all transactions from senders with at least one
   * invalid transaction.
   * @param {Block} block
   */
  purgeSendersWithInvalidTransactions(block) {
    const publicKeys = new Set(
      block.transactions
        .filter(tx => !tx.verified)
        .map(tx => tx.senderPublicKey),
    )

    publicKeys.forEach(publicKey => this.purgeByPublicKey(publicKey))
  }

  /**
   * Purges all transactions from the block.
   * @param {Block} block
   */
  purgeBlock(block) {
    block.transactions.forEach(tx => this.removeTransaction(tx))
  }

  checkApplyToBlockchain(transaction) {
    const errors = []
    const wallet = database.walletManager.findByPublicKey(
      transaction.senderPublicKey,
    )
    if (!wallet.canApply(transaction, errors)) {
      this.removeTransaction(transaction)

      logger.debug(
        `CanApply transaction test failed from transaction pool for transaction id:${
          transaction.id
        } due to ${JSON.stringify(
          errors,
        )}. Possible double spending attack :bomb:`,
      )

      this.purgeByPublicKey(transaction.senderPublicKey)
      this.blockSender(transaction.senderPublicKey)

      return false
    }

    return true
  }

  /**
   * Check whether a given sender has any transactions of the specified type
   * in the pool.
   * @param {String} senderPublicKey public key of the sender
   * @param {Number} transactionType transaction type, must be one of
   * TRANSACTION_TYPES.* and is compared against transaction.type.
   * @return {Boolean} true if exist
   */
  senderHasTransactionsOfType(senderPublicKey, transactionType) {
    throw new Error('Method [senderHasTransactionsOfType] not implemented!')
  }
}
