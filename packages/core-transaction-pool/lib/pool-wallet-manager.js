'use strict'
const { crypto } = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const { Wallet } = require('@arkecosystem/crypto').models
const { WalletManager } = require('@arkecosystem/core-database')

module.exports = class PoolWalletManager extends WalletManager {
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
      this.walletsByAddress[address] = wallet
    }

    return this.walletsByAddress[address]
  }

  /**
   * Removes wallet from PoolWalletManager
   * @param  {String} publicKey
   * @return {void}
   */
  deleteWallet (publicKey) {
    const wallet = this.getWalletByPublicKey(publicKey)
    delete this.walletsByPublicKey[publicKey]
    delete this.walletsByAddress[wallet.address]

    if (wallet.username) {
      delete this.walletByUsername
    }
  }
}
