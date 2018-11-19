const Handler = require('./handler')

class TimelockTransferHandler extends Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @param {Array} errors
   * @return {Boolean}
   */
  canApply(wallet, transaction, errors) {
    return super.canApply(wallet, transaction, errors)
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

module.exports = new TimelockTransferHandler()
