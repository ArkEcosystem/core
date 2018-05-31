const container = require('@arkecosystem/core-container')

module.exports = {
  /* Gets the blockchain state wallet.
   * @param transaction
   */
  getWalletFromBlockchain: (transaction) => {
    const wallet = container
    .resolvePlugin('blockchain')
    .database
    .walletManager
    .getWalletByPublicKey(transaction.senderPublicKey)

    return wallet
  }
}
