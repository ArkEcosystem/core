const container = require('@arkecosystem/core-container')

module.exports = {
  /**
 * Verify if the transactions is valid and if the sender has sufficient funds.
 * @param  {Object} transaction must be institiated with new Transaction
 * @return {Boolean}
 */
  canApply: (transaction) => {
    const wallet = container
    .resolvePlugin('blockchain')
    .database
    .walletManager
    .getWalletByPublicKey(transaction.senderPublicKey)

    if (transaction.verified) { // transaction verified is set when initializing new Transaction
      return wallet.canApply(transaction)
    }

    return false
  }
}
