'use strict'
const { crypto } = require('@arkecosystem/crypto')

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')

const { WalletManager } = require('@arkecosystem/core-database')

module.exports = class PoolWalletManager extends WalletManager {
    /**
   * Get a wallet by the given address. If wallet is not found it is copied from blockchain wallet manager
   * Method overriden from WalletManager
   * @param  {String} address
   * @return {(Wallet|null)}
   */
  getWalletByAddress (address) {
    if (!this.walletsByAddress[address]) {
      this.walletsByAddress[address] = container.resolvePlugin('blockchain').database.walletManager.getWalletByAddress(address)
    }

    return this.walletsByAddress[address]
  }

  /**
   * Get a wallet by the given public key. Method overriden from WalletManager
   * @param  {String} publicKey
   * @return {Wallet}
   */
  getWalletByPublicKey (publicKey) {
    if (!this.walletsByPublicKey[publicKey]) {
      const address = crypto.getAddress(publicKey, config.network.pubKeyHash)

      this.walletsByPublicKey[publicKey] = this.getWalletByAddress(address)
      this.walletsByPublicKey[publicKey].publicKey = publicKey
    }

    return this.walletsByPublicKey[publicKey]
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
