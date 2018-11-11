const Handler = require('./handler')

class DelegateRegistrationHandler extends Handler {
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

    const username = transaction.asset.delegate.username

    return !wallet.username && username && username === username.toLowerCase()
  }

  /**
   * Apply the transaction to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  apply(wallet, transaction) {
    wallet.username = transaction.asset.delegate.username
  }

  /**
   * Revert the transaction from the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  revert(wallet, transaction) {
    wallet.username = null
  }
}

module.exports = new DelegateRegistrationHandler()
