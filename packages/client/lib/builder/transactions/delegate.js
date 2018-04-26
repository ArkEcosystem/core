const feeManager = require('../../managers/fee')
const Transaction = require('../transaction')
const { TRANSACTION_TYPES } = require('../../constants')

module.exports = class Delegate extends Transaction {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.DELEGATE
    this.fee = feeManager.get(TRANSACTION_TYPES.DELEGATE)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { delegate: {} }
  }

  /**
   * Overrides the inherited method to add the necessary parameters.
   * @param  {String}   username
   * @return {Delegate}
   */
  create (username) {
    this.username = username
    return this
  }

  /**
   * Overrides the inherited `sign` method to include the public key of the new delegate.
   * @param  {String}   passphrase
   * @return {Delegate}
   */
  sign (passphrase) {
    super.sign(passphrase)
    this.asset.delegate.publicKey = this.senderPublicKey
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
