const Handler = require('./handler')

class DelegateResignationHandler extends Handler {
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

    const canApply = !!wallet.username
    if (!canApply) {
      errors.push('Wallet has not registered a username')
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
    //
  }

  /**
   * Revert the transaction from the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  revert(wallet, transaction) {
    //
  }
}

module.exports = new DelegateResignationHandler()
