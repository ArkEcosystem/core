const Bignum = require('../../utils/bignum')
const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')
const vendorField = require('./mixins/vendor-field')

class TransferBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.data.type = TRANSACTION_TYPES.TRANSFER
    this.data.fee = Bignum.from(feeManager.get(TRANSACTION_TYPES.TRANSFER))
    this.data.amount = Bignum.ZERO
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.expiration = 15 // 15 blocks, 120s
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.data.amount.toNumber()
    struct.recipientId = this.data.recipientId
    struct.asset = this.data.asset
    struct.vendorField = this.data.vendorField
    // struct.vendorFieldHex = this.vendorFieldHex // v2
    return struct
  }
}

module.exports = vendorField.mixin(TransferBuilder)
