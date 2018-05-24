const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')
const { crypto } = require('../../crypto')

module.exports = class DelegateRegistrationBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.DELEGATE_REGISTRATION
    this.fee = feeManager.get(TRANSACTION_TYPES.DELEGATE_REGISTRATION)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { delegate: {} }
  }

  /**
   * Overrides the inherited method to add the necessary parameters.
   * @param  {String}   username
   * @return {DelegateRegistrationBuilder}
   */
  create (username) {
    this.asset.delegate.username = username
    return this
  }

  /**
   * Overrides the inherited `sign` method to include the public key of the new delegate.
   * @param  {String}   passphrase
   * @return {DelegateRegistrationBuilder}
   */
  sign (passphrase) {
    this.asset.delegate.publicKey = crypto.getKeys(passphrase).publicKey
    super.sign(passphrase)
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this type of transaction.
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
