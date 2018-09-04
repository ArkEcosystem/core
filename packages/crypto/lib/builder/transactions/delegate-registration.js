const Bignum = require('bigi')
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

    this.data.type = TRANSACTION_TYPES.DELEGATE_REGISTRATION
    this.data.fee = new Bignum(feeManager.get(TRANSACTION_TYPES.DELEGATE_REGISTRATION).toString())
    this.data.amount = Bignum.ZERO
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.asset = { delegate: {} }
  }

  /**
   * Establish the delegate username on the asset.
   * @param  {String} username
   * @return {DelegateRegistrationBuilder}
   */
  usernameAsset (username) {
    this.data.asset.delegate.username = username
    return this
  }

  /**
   * Overrides the inherited `sign` method to include the public key of the new delegate.
   * @param  {String}   passphrase
   * @return {DelegateRegistrationBuilder}
   * TODO rename to `assetDelegate` and merge with username ?
   */
  sign (passphrase) {
    this.data.asset.delegate.publicKey = crypto.getKeys(passphrase).publicKey
    super.sign(passphrase)
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this type of transaction.
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = +this.data.amount.toString()
    struct.recipientId = this.data.recipientId
    struct.asset = this.data.asset
    return struct
  }
}
