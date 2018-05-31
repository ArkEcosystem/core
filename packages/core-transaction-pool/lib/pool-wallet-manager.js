'use strict'

const { Wallet } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')

const { WalletManager } = require('@arkecosystem/core-database')

module.exports = class PoolWalletManager extends WalletManager {

   /**
   * Apply the given transaction to a delegate.
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  async applyTransaction (transaction) { /* eslint padded-blocks: "off" */
    const { data } = transaction
    const { type, asset, recipientId, senderPublicKey } = data

    const sender = this.getWalletByPublicKey(senderPublicKey)
    let recipient = recipientId ? this.getWalletByAddress(recipientId) : null

    if (!recipient && recipientId) { // cold wallet
      recipient = new Wallet(recipientId)
      this.walletsByAddress[recipientId] = recipient
      emitter.emit('wallet:cold:created', recipient)

    } else if (type === TRANSACTION_TYPES.DELEGATE_REGISTRATION && this.walletsByUsername[asset.delegate.username.toLowerCase()]) {

      logger.error(`Delegate transction sent by ${sender.address}`, JSON.stringify(data))
      throw new Error(`Can't apply transaction ${data.id}: delegate name already taken`)

    // NOTE: We use the vote public key, because vote transactions have the same sender and recipient
    } else if (type === TRANSACTION_TYPES.VOTE && !this.walletsByPublicKey[asset.votes[0].slice(1)].username) {

      logger.error(`Vote transaction sent by ${sender.address}`, JSON.stringify(data))
      throw new Error(`Can't apply transaction ${data.id}: voted delegate does not exist`)

    } else if (config.network.exceptions[data.id]) {

      logger.warn('Transaction forcibly applied because it has been added as an exception:', data)

    } else if (!sender.canApply(data)) {

      logger.error(`Can't apply transaction for ${sender.address}`, JSON.stringify(data))
      logger.debug('Audit', JSON.stringify(sender.auditApply(data), null, 2))
      throw new Error(`Can't apply transaction ${data.id}`)
    }

    sender.applyTransactionToSender(data)

    if (recipient && type === TRANSACTION_TYPES.TRANSFER) {
      recipient.applyTransactionToRecipient(data)
    }

    this.__emitEvents(transaction)

    return transaction
  }

}
