const { crypto } = require('../../crypto')
const configManager = require('../../managers/config')
const { transactionValidator } = require('@arkecosystem/validation')

module.exports = class Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply (wallet, transaction) {
    if (transactionValidator.validate(transaction).fails) {
      return false
    }

    let applicable = true

    if (wallet.multisignature) {
      applicable = wallet.verifySignatures(transaction, wallet.multisignature)
    } else {
      const enoughBalance = (wallet.balance - transaction.amount - transaction.fee) >= 0
      applicable = (transaction.senderPublicKey === wallet.publicKey) && enoughBalance

      // TODO: this can blow up if 2nd phrase and other transactions are in the wrong order
      applicable = applicable && (!wallet.secondPublicKey || crypto.verifySecondSignature(transaction, wallet.secondPublicKey, configManager.config)) // eslint-disable-line max-len
    }

    return applicable
  }

  /**
   * Associate this wallet as the sender of a transaction.
   * @param {Wallet} wallet
   * @param {Transaction} transaction
   * @return {void}
   */
  applyTransactionToSender (wallet, transaction) {
    if (transaction.senderPublicKey === wallet.publicKey || crypto.getAddress(transaction.senderPublicKey) === wallet.address) {
      wallet.balance -= transaction.amount + transaction.fee

      this.apply(wallet, transaction)

      wallet.dirty = true
    }
  }

  /**
   * Remove this wallet as the sender of a transaction.
   * @param {Wallet} wallet
   * @param {Transaction} transaction
   * @return {void}
   */
  revertTransactionForSender (wallet, transaction) {
    if (transaction.senderPublicKey === wallet.publicKey || crypto.getAddress(transaction.senderPublicKey) === wallet.address) {
      wallet.balance += transaction.amount + transaction.fee

      this.revert(wallet, transaction)

      wallet.dirty = true
    }
  }

  /**
   * Add transaction balance to this wallet.
   * @param {Wallet} wallet
   * @param {Transaction} transaction
   * @return {void}
   */
  applyTransactionToRecipient (wallet, transaction) {
    if (transaction.recipientId === wallet.address) {
      wallet.balance += transaction.amount
      wallet.dirty = true
    }
  }

  /**
   * Remove transaction balance from this wallet.
   * @param {Wallet} wallet
   * @param {Transaction} transaction
   * @return {void}
   */
  revertTransactionForRecipient (wallet, transaction) {
    if (transaction.recipientId === wallet.address) {
      wallet.balance -= transaction.amount
      wallet.dirty = true
    }
  }
}
