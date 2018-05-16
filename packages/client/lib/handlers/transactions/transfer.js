const Handler = require('./handler')

class TransferHandler extends Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply (wallet, transaction) {
    return super.canApply(wallet, transaction)
  }

  /**
   * Apply the transaction to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  apply (wallet, transaction) {
    //
  }

  revert (wallet, transaction) {
    //
  }
}

module.exports = new TransferHandler()
