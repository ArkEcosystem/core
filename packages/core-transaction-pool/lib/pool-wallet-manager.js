'use strict'
const container = require('@arkecosystem/core-container')

const { WalletManager } = require('@arkecosystem/core-database')
const logger = container.resolvePlugin('logger')

module.exports = class PoolWalletManager extends WalletManager {
  /**
   * Create a new pool wallet manager instance.
   * @constructor
   */
  constructor () {
    super()

    this.emitEvents = false
  }

  /**
   * Checks if wallet exits in pool wallet manager
   * Method overrides base class method from WalletManager.
   * @param  {String} key can be publicKey or address of wallet
   * @return {Boolean} true if exists
   */
  exists (key) {
    if (this.walletsByPublicKey[key]) {
      return true
    }

    if (this.walletsByAddress[key]) {
      return true
    }
    return false
  }

  /**
   * Empty the pool manager wallets
   * @return {void}
   */
  purgeAll () {
    Object.keys(this.walletsByPublicKey).forEach(publicKey => {
      delete this.walletsByPublicKey[publicKey]
    })

    Object.keys(this.walletsByAddress).forEach(address => {
      delete this.walletsByAddress[address]
    })

    Object.keys(this.walletsByUsername).forEach(username => {
      delete this.walletsByUsername[username]
    })
  }

  /**
   * Init of pool manager wallets from blockchain wallets
   * Method is called on start (SPV) and after rebuild is finished
   * @param  {Array} wallets
   * @return {void}
   */
  initWallets (wallets) {
    this.purgeAll()
    this.walletsByPublicKey = wallets.map(wallet => {
      this.reindex(wallet)
      return wallet
    })
  }

  /**
   * Apply the given block to a delegate in the pool wallet manager.
   * We apply only the block reward and fees, as transaction are already be applied
   * when entering the pool. Applying only if delegate wallet is in pool wallet manager
   * Method overrides method from wallet-manager base class
   * @param  {Block} block
   * @return {void}
   */
  async applyBlock (block) {
    if (this.exists(block.data.generatorPublicKey)) {
      const delegate = this.getWalletByPublicKey(block.data.generatorPublicKey)
      delegate.applyBlock(block.data)
    }
  }

  /** Checks if we can apply transaction, and applies it to the pool wallet manager
   * @param {Transaction} transaction
   * @return {Boolean}
   */
  async applyTransaction (transaction) {
    const wallet = this.getWalletByPublicKey(transaction.senderPublicKey)

    if (!wallet.canApply(transaction)) {
      logger.debug(`PoolWalletManager: Can't apply transaction ${transaction.id} with ${transaction.amount} to wallet with ${wallet.balance} balance`)
      return false
    }
    try {
        // TODO: remove console.log
      console.log('----------------------')
      console.log('Pool 1>', this.getWalletByPublicKey(transaction.senderPublicKey).balance)

      super.applyTransaction(transaction)

      console.log('Pool 2>', this.getWalletByPublicKey(transaction.senderPublicKey).balance)
      console.log('Pool recepient>', this.getWalletByAddress(transaction.recipientId).balance)

      return true
    } catch (error) {
      logger.error(`Can't apply transaction ${error}`)
      return false
    }
  }
}
