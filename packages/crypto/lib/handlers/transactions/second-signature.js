const Handler = require('./handler')

class SecondSignatureHandler extends Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @param {Array} errors
   * @return {Boolean}
   */
  canApply(wallet, transaction, errors) {
    if (!super.canApply(wallet, transaction, errors)) {
      return false
    }

    const canApply = !wallet.secondPublicKey
    if (!canApply) {
      errors.push('Wallet already has a second signature')
    }
    return canApply
  }

  /**
   * Apply the transaction to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  apply(wallet, transaction) {
    wallet.secondPublicKey = transaction.asset.signature.publicKey
  }

  /**
   * Revert the transaction from the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  revert(wallet, transaction) {
    wallet.secondPublicKey = null
  }
}

module.exports = new SecondSignatureHandler()
