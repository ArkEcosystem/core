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

    this.data.type = TRANSACTION_TYPES.MULTI_SIGNATURE
    this.data.fee = 0
    this.data.amount = 0
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.asset = { multisignature: {} }
  }

  /**
   * Overrides the inherited method to add the necessary parameters.
   * @param  {Array} keysgroup
   * @param  {Number} lifetime
   * @param  {Number} min
   * @return {MultiSignatureBuilder}
   */
  create (keysgroup, lifetime, min) {
    this.data.asset.multisignature.keysgroup = keysgroup
    this.data.asset.multisignature.lifetime = lifetime
    this.data.asset.multisignature.min = min
    this.data.fee = (keysgroup.length + 1) * feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)

    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this.
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.data.amount
    struct.recipientId = this.data.recipientId
    struct.asset = this.data.asset

    return struct
  }
}

module.exports = sign.mixin(MultiSignatureBuilder)
