'use strict'
const container = require('@arkecosystem/core-container')

const { Wallet } = require('@arkecosystem/crypto').models
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
   * Get a wallet by the given address. If wallet is not found it is copied from blockchain wallet manager
   * Method overrides base class method from WalletManager.
   * @param  {String} address
   * @return {(Wallet|null)}
   */
  getWalletByAddress (address) {
    if (!this.walletsByAddress[address]) {
      const blockchainWallet = container.resolvePlugin('blockchain').database.walletManager.getWalletByAddress(address)
      const wallet = Object.assign(new Wallet(address), blockchainWallet) // do not modify

      this.reindex(wallet)
    }

    return this.walletsByAddress[address]
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
   * Removes wallet from PoolWalletManager
   * @param  {String} publicKey
   * @return {void}
   */
  deleteWallet (publicKey) {
    if (this.exists(publicKey)) {
      const wallet = this.getWalletByPublicKey(publicKey)
      delete this.walletsByPublicKey[publicKey]
      delete this.walletsByAddress[wallet.address]

      if (wallet.username) {
        delete this.walletByUsername
      }
    }
  }

  purgeAll () {
    Object.keys(this.walletsByPublicKey).forEach(publicKey => {
      this.deleteWallet(publicKey)
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
      console.log('Pool before', this.getWalletByPublicKey(transaction.senderPublicKey).balance)

      super.applyTransaction(transaction)

      console.log('Pool sender:', this.getWalletByPublicKey(transaction.senderPublicKey).balance)
      console.log('Pool recepient:', this.getWalletByAddress(transaction.recipientId).balance)

      console.log('Blockchain balance', container
        .resolvePlugin('blockchain')
        .database
        .walletManager
        .getWalletByPublicKey(transaction.senderPublicKey).balance)

      return true
    } catch (error) {
      logger.error(`Can't apply transaction ${error}`)
      return false
    }
  }
}
