const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')
const { crypto } = require('../../crypto')

module.exports = class SecondSignatureBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.data.type = TRANSACTION_TYPES.SECOND_SIGNATURE
    this.data.fee = feeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)
    this.data.amount = 0
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.asset = { signature: {} }
  }

  /**
   * Establish the signature on the asset, which is the one that would be that
   * would be register on the blockchain, when creating a second passphrase.
   * @param {String} secondPassphrase
   * @return {SecondSignatureBuilder}
   */
  signatureAsset(secondPassphrase) {
    this.data.asset.signature.publicKey = crypto.getKeys(
      secondPassphrase,
    ).publicKey
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this.
   * @return {Object}
   */
  getStruct() {
    const struct = super.getStruct()
    struct.amount = this.data.amount
    struct.recipientId = this.data.recipientId
    struct.asset = this.data.asset
    return struct
  }
}
