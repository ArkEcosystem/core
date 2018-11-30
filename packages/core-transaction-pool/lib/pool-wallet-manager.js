const app = require('@arkecosystem/core-container')
const { Wallet } = require('@arkecosystem/crypto').models
const { WalletManager } = require('@arkecosystem/core-database')

const logger = app.resolvePlugin('logger')
const database = app.resolvePlugin('database')
const config = app.resolvePlugin('config')
const { crypto } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

module.exports = class PoolWalletManager extends WalletManager {
  /**
   * Create a new pool wallet manager instance.
   * @constructor
   */
  constructor() {
    super()

    this.emitEvents = false
  }

  /**
   * Get a wallet by the given address. If wallet is not found it is copied from blockchain
   * wallet manager. Method overrides base class method from WalletManager.
   * WARNING: call only upon guard apply, as if wallet not found it gets it from blockchain.
   * For existing key checks use function exists(key)
   * @param  {String} address
   * @return {(Wallet|null)}
   */
  findByAddress(address) {
    if (!this.byAddress[address]) {
      const blockchainWallet = database.walletManager.findByAddress(address)
      const wallet = Object.assign(new Wallet(address), blockchainWallet) // do not modify

      this.reindex(wallet)
    }

    return this.byAddress[address]
  }

  /**
   * Checks if wallet exits in pool wallet manager
   * Method overrides base class method from WalletManager.
   * @param  {String} key can be publicKey or address of wallet
   * @return {Boolean} true if exists
   */
  exists(key) {
    if (this.byPublicKey[key]) {
      return true
    }

    if (this.byAddress[key]) {
      return true
    }
    return false
  }

  deleteWallet(publicKey) {
    this.forgetByPublicKey(publicKey)
    this.forgetByAddress(
      crypto.getAddress(publicKey, config.network.pubKeyHash),
    )
  }

  /**
   * Checks if the transaction can be applied.
   * @param  {Object|Transaction} transaction
   * @param  {Array} errors The errors are written into the array.
   * @return {Boolean}
   */
  canApply(transaction, errors) {
    // Edge case if sender is unknown and has no balance.
    // NOTE: Check is performed against the database wallet manager.
    if (!database.walletManager.byPublicKey[transaction.senderPublicKey]) {
      const senderAddress = crypto.getAddress(
        transaction.senderPublicKey,
        config.network.pubKeyHash,
      )

      if (
        database.walletManager.findByAddress(senderAddress).balance.isZero()
      ) {
        errors.push(
          'Cold wallet is not allowed to send until receiving transaction is confirmed.',
        )
        return false
      }
    }

    const sender = this.findByPublicKey(transaction.senderPublicKey)
    const { type, asset } = transaction

    if (
      type === TRANSACTION_TYPES.DELEGATE_REGISTRATION &&
      database.walletManager.byUsername[asset.delegate.username.toLowerCase()]
    ) {
      logger.error(
        `[PoolWalletManager] Can't apply transaction ${
          transaction.id
        }: delegate name already taken. Data: ${JSON.stringify(transaction)}`,
      )

      errors.push(
        `Can't apply transaction ${
          transaction.id
        }: delegate name already taken.`,
      )
      // NOTE: We use the vote public key, because vote transactions have the same sender and recipient.
    } else if (
      type === TRANSACTION_TYPES.VOTE &&
      !database.walletManager.__isDelegate(asset.votes[0].slice(1))
    ) {
      logger.error(
        `[PoolWalletManager] Can't apply vote transaction: delegate ${
          asset.votes[0]
        } does not exist. Data: ${JSON.stringify(transaction)}`,
      )

      errors.push(
        `Can't apply transaction ${transaction.id}: delegate ${
          asset.votes[0]
        } does not exist.`,
      )
    } else if (this.__isException(transaction)) {
      logger.warn(
        `Transaction forcibly applied because it has been added as an exception: ${transaction}`,
      )
    } else if (!sender.canApply(transaction, errors)) {
      const message = `[PoolWalletManager] Can't apply transaction id:${
        transaction.id
      } from sender:${sender.address}`
      logger.error(`${message} due to ${JSON.stringify(errors)}`)
      errors.unshift(message)
    }

    return errors.length === 0
  }

  /**
   * Remove the given transaction from a sender only.
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  revertTransactionForSender(transaction) {
    const { data } = transaction
    const sender = this.findByPublicKey(data.senderPublicKey) // Should exist

    sender.revertTransactionForSender(data)

    return data
  }
}
