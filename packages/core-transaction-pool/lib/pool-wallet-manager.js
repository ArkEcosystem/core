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
   * Apply the given transaction to a wallet. A combination of pool wallet
   * and blockchain wallet manager is used.
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  applyPoolTransaction(transaction) {
    /* eslint padded-blocks: "off" */
    const { data } = transaction
    const { type, asset, recipientId, senderPublicKey } = data
    const errors = []

    const sender = this.findByPublicKey(senderPublicKey)

    if (
      type === TRANSACTION_TYPES.DELEGATE_REGISTRATION &&
      database.walletManager.byUsername[asset.delegate.username.toLowerCase()]
    ) {
      logger.error(
        `[PoolWalletManager] Can't apply transaction ${
          data.id
        }: delegate name already taken.`,
        JSON.stringify(data),
      )

      throw new Error(
        `[PoolWalletManager] Can't apply transaction ${
          data.id
        }: delegate name already taken.`,
      )

      // NOTE: We use the vote public key, because vote transactions
      // have the same sender and recipient.
    } else if (
      type === TRANSACTION_TYPES.VOTE &&
      !database.walletManager.__isDelegate(asset.votes[0].slice(1))
    ) {
      logger.error(
        `[PoolWalletManager] Can't apply vote transaction: delegate ${
          asset.votes[0]
        } does not exist.`,
        JSON.stringify(data),
      )

      throw new Error(
        `[PoolWalletManager] Can't apply transaction ${data.id}: delegate ${
          asset.votes[0]
        } does not exist.`,
      )
    } else if (this.__isException(data)) {
      logger.warn(
        'Transaction forcibly applied because it has been added as an exception:',
        data,
      )
    } else if (!sender.canApply(data, errors)) {
      const message = `[PoolWalletManager] Can't apply transaction id:${
        data.id
      } from sender:${sender.address} due to ${JSON.stringify(errors)}`
      logger.error(message)
      logger.debug(
        `[PoolWalletManager] Audit: ${JSON.stringify(
          sender.auditApply(data),
          null,
          2,
        )}`,
      )

      throw new Error(message)
    }

    sender.applyTransactionToSender(data)

    if (type === TRANSACTION_TYPES.TRANSFER) {
      const recipient = this.findByAddress(recipientId)
      recipient.applyTransactionToRecipient(data)
    }

    return transaction
  }

  /**
   * Apply the given block to a delegate in the pool wallet manager.
   * We apply only the block reward and fees, as transaction are already be applied
   * when entering the pool. Applying only if delegate wallet is in pool wallet manager
   * @param {block}
   */
  applyPoolBlock(block) {
    // if delegate in poll wallet manager - apply rewards
    if (this.exists(block.data.generatorPublicKey)) {
      const delegateWallet = this.findByPublicKey(block.data.generatorPublicKey)
      delegateWallet.applyBlock(block.data)
    }
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
    return sender.canApply(transaction, errors)
  }
}
