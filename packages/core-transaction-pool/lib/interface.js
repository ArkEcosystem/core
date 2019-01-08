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
  getTransactionsForForging(blockSize) {
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
  getTransactionIdsForForging(start, size) {
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
    for (const { data } of block.transactions) {
      const exists = this.transactionExists(data.id)
      const senderPublicKey = data.senderPublicKey

      const senderWallet = this.walletManager.exists(senderPublicKey)
        ? this.walletManager.findByPublicKey(senderPublicKey)
        : false

      const recipientWallet = this.walletManager.exists(data.recipientId)
        ? this.walletManager.findByAddress(data.recipientId)
        : false

      if (recipientWallet) {
        recipientWallet.applyTransactionToRecipient(data)
      }

      if (exists) {
        this.removeTransaction(data)
      } else if (senderWallet) {
        const errors = []
        if (senderWallet.canApply(data, errors)) {
          senderWallet.applyTransactionToSender(data)
        } else {
          this.purgeByPublicKey(data.senderPublicKey)
          this.blockSender(data.senderPublicKey)

          logger.error(
            `CanApply transaction test failed on acceptChainedBlock() in transaction pool for transaction id:${
              data.id
            } due to ${JSON.stringify(
              errors,
            )}. Possible double spending attack :bomb:`,
          )
        }
      }

      if (
        senderWallet.balance === 0 &&
        this.getSenderSize(senderPublicKey) === 0
      ) {
        this.walletManager.deleteWallet(senderPublicKey)
      }
    }

    // if delegate in poll wallet manager - apply rewards and fees
    if (this.walletManager.exists(block.data.generatorPublicKey)) {
      const delegateWallet = this.walletManager.findByPublicKey(
        block.data.generatorPublicKey,
      )
      const increase = block.data.reward.plus(block.data.totalFee)
      delegateWallet.balance = delegateWallet.balance.plus(increase)
    }

    app
      .resolve('state')
      .removeCachedTransactionIds(block.transactions.map(tx => tx.id))
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

      const senderWallet = this.walletManager.findByPublicKey(
        transaction.senderPublicKey,
      )
      const errors = []
      if (senderWallet && senderWallet.canApply(transaction, errors)) {
        senderWallet.applyTransactionToSender(transaction)
      } else {
        logger.error('BuildWallets from pool:', errors)
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
   * Purges if transaction exists. It assumes that if trx exists that also wallet exists in pool
   * @param {Block} block
   */
  purgeBlock(block) {
    block.transactions.forEach(tx => {
      if (this.transactionExists(tx.id)) {
        this.removeTransaction(tx)
        this.walletManager
          .findByPublicKey(tx.senderPublicKey)
          .revertTransactionForSender(tx)
      }
    })
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
