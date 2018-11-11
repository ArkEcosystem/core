const Handler = require('./handler')

class MultiSignatureHandler extends Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply(wallet, transaction) {
    if (!super.canApply(wallet, transaction)) {
      return false
    }

    if (wallet.multisignature) {
      return false
    }

    const keysgroup = transaction.asset.multisignature.keysgroup

    if (keysgroup.length < transaction.asset.multisignature.min) {
      return false
    }

    if (keysgroup.length !== transaction.signatures.length) {
      return false
    }

    return wallet.verifySignatures(
      transaction,
      transaction.asset.multisignature,
    )
  }

  /**
   * Apply the transaction to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  apply(wallet, transaction) {
    wallet.multisignature = transaction.asset.multisignature
  }

  /**
   * Revert the transaction from the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  revert(wallet, transaction) {
    wallet.multisignature = null
  }
}

module.exports = new MultiSignatureHandler()
