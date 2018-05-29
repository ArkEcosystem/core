const container = require('@arkecosystem/core-container')
const { crypto } = require('@arkecosystem/crypto')

/**
   * Verify if the transactions is valid and if the sender has sufficient funds.
   * @param  {Object} transaction
   * @param {Boolean} checkCrypto - if set to true also crypto verification will be perform, if false - onlu wallet verification
   * @return {Boolean}
   */
module.exports = (transaction, checkCrypto = true) => {
  const wallet = container
  .resolvePlugin('blockchain')
  .database
  .walletManager
  .getWalletByPublicKey(transaction.senderPublicKey)

  if (checkCrypto) {
    return crypto.verify(transaction) && wallet.canApply(transaction)
  }

  return wallet.canApply(transaction)
}
