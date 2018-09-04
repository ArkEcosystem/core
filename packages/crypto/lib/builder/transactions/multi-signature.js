const Bignum = require('../../utils/bignum')
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
    this.data.fee = Bignum.ZERO
    this.data.amount = Bignum.ZERO
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.asset = { multisignature: {} }
  }

  /**
   * Establish the multi-signature on the asset and updates the fee.
   * @param  {Object} multiSignature { keysgroup, lifetime, min }
   * @return {MultiSignatureBuilder}
   */
  multiSignatureAsset (multiSignature) {
    this.data.asset.multisignature = multiSignature
    this.data.fee = Bignum.fromBuffer((multiSignature.keysgroup.length + 1) * feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE))

    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this.
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.data.amount.toNumber()
    struct.recipientId = this.data.recipientId
    struct.asset = this.data.asset

    return struct
  }
}

module.exports = sign.mixin(MultiSignatureBuilder)
