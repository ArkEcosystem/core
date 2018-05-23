const Handler = require('./handler')

class MultiSignatureHandler extends Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply (wallet, transaction) {
    console.log('multisig', 'a', transaction, wallet)
    console.log((new Error()).stack)
    if (!super.canApply(wallet, transaction)) {
      return false
    }
    console.log('multisig', 'b')

    if (wallet.multisignature) {
      return false
    }
    console.log('multisig', 'c')

    const keysgroup = transaction.asset.multisignature.keysgroup
    console.log('multisig', 'd')

    if (keysgroup.length < transaction.asset.multisignature.min) {
      return false
    }
    console.log('multisig', 'e')

    if (keysgroup.length !== transaction.signatures.length) {
      return false
    }
    console.log('multisig', 'f', keysgroup)

    return wallet.verifySignatures(transaction, transaction.asset.multisignature)
  }

  /**
   * Apply the transaction to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  apply (wallet, transaction) {
    wallet.multisignature = transaction.asset.multisignature
  }

  /**
   * Revert the transaction from the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  revert (wallet, transaction) {
    wallet.multisignature = null
  }
}

module.exports = new MultiSignatureHandler()
