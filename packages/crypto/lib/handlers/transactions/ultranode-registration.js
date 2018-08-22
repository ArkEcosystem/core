const Handler = require('./handler')

class DelegateRegistrationHandler extends Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply (wallet, transaction) {
    if (!super.canApply(wallet, transaction)) {
      return false
    }

    const ultra_node = transaction.asset.ultranode.username

    return !wallet.ultra_node && ultra_node && ultra_node === ultra_node.toLowerCase()
  }

  /**
   * Apply the transaction to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  apply (wallet, transaction) {
    wallet.ultra_node = transaction.asset.ultranode.username
  }

  /**
   * Revert the transaction from the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  revert (wallet, transaction) {
    wallet.ultra_node = null
  }
}

module.exports = new DelegateRegistrationHandler()
