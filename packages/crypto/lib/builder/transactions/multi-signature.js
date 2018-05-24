const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')
const sign = require('./mixins/sign')

class MultiSignatureBuilder extends TransactionBuilder {
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
   * @return {MultiSignatureBuilder}
   */
  create (keysgroup, lifetime, min) {
    this.asset.multisignature.keysgroup = keysgroup
    this.asset.multisignature.lifetime = lifetime
    this.asset.multisignature.min = min
    this.fee = (keysgroup.length + 1) * feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)

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

module.exports = sign.mixin(MultiSignatureBuilder)
