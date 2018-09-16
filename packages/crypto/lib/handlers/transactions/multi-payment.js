const Handler = require('./handler')
const Bignum = require('../../utils/bignum')

class MultiPaymentHandler extends Handler {
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

    const amount = transaction.asset.payments.reduce((total, payment) => (total.plus(payment.amount)), Bignum.ZERO)

    return (wallet.balance.minus(amount).minus(transaction.fee)).toNumber() >= 0
  }

  /**
   * Apply the transaction to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  apply (wallet, transaction) {
    //
  }

  /**
   * Revert the transaction from the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  revert (wallet, transaction) {
    //
  }
}

module.exports = new MultiPaymentHandler()
