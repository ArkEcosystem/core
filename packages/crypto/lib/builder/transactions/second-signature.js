const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const Transaction = require('./transaction')
const { crypto } = require('../../crypto')

module.exports = class SecondSignature extends Transaction {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.SECOND_SIGNATURE
    this.fee = feeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { signature: {} }
  }

  /**
   * Overrides the inherited `sign` method to include the generated second signature.
   * @param  {String}          passphrase
   * @return {SecondSignature}
   */
  create (secondPassphrase) {
    this.asset.signature.publicKey = crypto.getKeys(secondPassphrase).publicKey
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this.
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.amount
    struct.recipientId = this.recipientId
    struct.asset = this.asset
    return struct
  }
}
