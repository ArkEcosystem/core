const Handler = require('./handler')

class DelegateRegistrationHandler extends Handler {
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

    const username = transaction.asset.delegate.username
    // TODO: Checking whether the username is a lowercase version of itself seems silly. Why can't we mutate it to lowercase
    const canApply =
      !wallet.username && username && username === username.toLowerCase()
    if (!canApply) {
      errors.push('Wallet already has a registered username')
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
