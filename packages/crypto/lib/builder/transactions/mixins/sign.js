const { crypto } = require('../../../crypto')

module.exports = {
  mixin (Base) {
    return class extends Base {
      /**
       * Overrides the inherited `sign` method to set the sender as the recipient too
       * @param  {String} passphrase
       * @return {TransactionBuilder}
       */
      sign (passphrase) {
        this.recipientId = crypto.getAddress(crypto.getKeys(passphrase).publicKey)
        super.sign(passphrase)
        return this
      }
    }
  }
}
