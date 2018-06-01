const container = require('@arkecosystem/core-container')

module.exports = {
  /* Gets the blockchain wallet and checks if transaction can be applied - before returning it to forger.
   * @param transaction
   */
  canApplyToBlockchain: (transaction) => {
    const wallet = container
    .resolvePlugin('blockchain')
    .database
    .walletManager
    .getWalletByPublicKey(transaction.senderPublicKey)

    return wallet.canApply(transaction)
  }
}
