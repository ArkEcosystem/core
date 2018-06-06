'use strict'
const container = require('@arkecosystem/core-container')
const { Wallet } = require('@arkecosystem/crypto').models
const { WalletManager } = require('@arkecosystem/core-database')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')
const config = container.resolvePlugin('config')
const { crypto } = require('@arkecosystem/crypto')

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
      const blockchainWallet = database.walletManager.getWalletByAddress(address)
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

  deleteWallet (publicKey) {
      delete this.walletsByPublicKey[publicKey]

      delete this.walletsByAddress[crypto.getAddress(publicKey, config.network.pubKeyHash)]
  }

  /**
   * Apply the given block to a delegate in the pool wallet manager.
   * We apply only the block reward and fees, as transaction are already be applied
   * when entering the pool. Applying only if delegate wallet is in pool wallet manager
   * Method overrides method from wallet-manager base class
   * @param  {Block} block
   * @return {void}
   */
  applyBlock (block) {
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
      logger.debug(`PoolWalletManager: Can't canApply transaction ${transaction.id} with ${transaction.amount}, wallet ${wallet.balance} balance`)

      return false
    }

    try {
      await super.applyTransaction(transaction)

      return true
    } catch (error) {
      logger.error(`PoolWalletManager: Can't apply transaction ${transaction.id} - ${error}`)

      return false
    }
  }
}
