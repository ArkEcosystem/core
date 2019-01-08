const { crypto } = require('../../../crypto')
const configManager = require('../../../managers/config')

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

      /**
       * Overrides the inherited `signWithWif` method to set the sender as the recipient too
       * @param  {String} wif
       * @param  {String} networkWif - value associated with network
       * @return {TransactionBuilder}
       */
      signWithWif(wif, networkWif) {
        const pubKeyHash = this.data.network
          ? this.data.network.pubKeyHash
          : null
        const keys = crypto.getKeysFromWIF(wif, {
          wif: networkWif || configManager.get('wif'),
        })
        this.data.recipientId = crypto.getAddress(keys.publicKey, pubKeyHash)
        super.signWithWif(wif, networkWif)

        return this
      }
    }
  },
}
