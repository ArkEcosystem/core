const feeManager = require('../../managers/fee')
const { crypto } = require('../../crypto')
const { TRANSACTION_TYPES } = require('../../constants')
const Transaction = require('./transaction')

module.exports = class MultiSignature extends Transaction {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.MULTI_SIGNATURE
    this.fee = 0
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { multisignature: {} }
  }

  /**
   * Overrides the inherited method to add the necessary parameters.
   * @param  {Array} keysgroup
   * @param  {Number} lifetime
   * @param  {Number} min
   * @return {MultiSignature}
   */
  create (keysgroup, lifetime, min) {
    this.asset.multisignature.keysgroup = keysgroup
    this.asset.multisignature.lifetime = lifetime
    this.asset.multisignature.min = min
    this.fee = (keysgroup.length + 1) * feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)

    return this
  }

  /**
   * Overrides the inherited `sign` method to set the sender as the recipient too
   * @param  {String} passphrase
   * @return {Vote}
   */
  sign (passphrase) {
    this.recipientId = crypto.getAddress(crypto.getKeys(passphrase).publicKey)
    super.sign(passphrase)
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
