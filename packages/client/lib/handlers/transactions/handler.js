const cryptoBuilder = require('../../builder/crypto')
const configManager = require('../../managers/config')

module.exports = class TransactionHandler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply (wallet, transaction) {
    let check = true

    if (wallet.multisignature) {
      check = check && wallet.verifySignatures(transaction, wallet.multisignature)
    } else {
      check = check && (transaction.senderPublicKey === wallet.publicKey) && (wallet.balance - transaction.amount - transaction.fee > -1) // eslint-disable-line max-len

      // TODO: this can blow up if 2nd phrase and other tx are in the wrong order
      check = check && (!wallet.secondPublicKey || cryptoBuilder.verifySecondSignature(transaction, wallet.secondPublicKey, configManager.config)) // eslint-disable-line max-len
    }

    return check
  }

  /**
   * Associate this wallet as the sender of a transaction.
   * @param {Wallet} wallet
   * @param {Transaction} transaction
   */
  applyTransactionToSender (wallet, transaction) {
    if (transaction.senderPublicKey === wallet.publicKey || cryptoBuilder.getAddress(transaction.senderPublicKey) === wallet.address) {
      wallet.balance -= transaction.amount + transaction.fee

      this.apply(wallet, transaction)

      wallet.dirty = true
    }
  }

  /**
   * Remove this wallet as the sender of a transaction.
   * @param {Wallet} wallet
   * @param {Transaction} transaction
   */
  revertTransactionForSender (wallet, transaction) {
    if (transaction.senderPublicKey === wallet.publicKey || cryptoBuilder.getAddress(transaction.senderPublicKey) === wallet.address) {
      wallet.balance += transaction.amount + transaction.fee

      this.revert(wallet, transaction)

      wallet.dirty = true
    }
  }

  /**
   * Add transaction balance to this wallet.
   * @param {Wallet} wallet
   * @param {Transaction} transaction
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
   */
  revertTransactionForRecipient (wallet, transaction) {
    if (transaction.recipientId === wallet.address) {
      wallet.balance -= transaction.amount
      wallet.dirty = true
    }
  }
}
