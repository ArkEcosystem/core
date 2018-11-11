const { crypto } = require('../../../crypto')

module.exports = {
  mixin(Base) {
    return class extends Base {
      /**
       * Overrides the inherited `sign` method to set the sender as the recipient too
       * @param  {String} passphrase
       * @return {TransactionBuilder}
       */
      sign(passphrase) {
        const pubKeyHash = this.data.network
          ? this.data.network.pubKeyHash
          : null
        this.data.recipientId = crypto.getAddress(
          crypto.getKeys(passphrase).publicKey,
          pubKeyHash,
        )
        super.sign(passphrase)
        return this
      }
    }
  },
}
