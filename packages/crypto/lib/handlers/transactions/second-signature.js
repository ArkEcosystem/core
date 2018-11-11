const Handler = require('./handler')

class SecondSignatureHandler extends Handler {
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

    return !wallet.secondPublicKey
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
