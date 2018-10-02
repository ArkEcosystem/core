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
    this.data.fee = feeManager.get(TRANSACTION_TYPES.TRANSFER)
    this.data.amount = 0
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.expiration = 0
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.data.amount
    struct.recipientId = this.data.recipientId
    struct.asset = this.data.asset
    struct.vendorField = this.data.vendorField
    // struct.vendorFieldHex = this.vendorFieldHex // v2
    return struct
  }
}

module.exports = vendorField.mixin(TransferBuilder)
