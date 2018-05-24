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

    this.type = TRANSACTION_TYPES.TRANSFER
    this.fee = feeManager.get(TRANSACTION_TYPES.TRANSFER)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.expiration = 15 // 15 blocks, 120s
  }

  /**
   * Overrides the inherited method to add the necessary parameters
   * @param  {String} recipientId
   * @param  {Number} amount
   * @return {TransferBuilder}
   */
  create (recipientId, amount) {
    this.recipientId = recipientId
    this.amount = amount
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.amount
    struct.recipientId = this.recipientId
    struct.asset = this.asset
    struct.vendorField = this.vendorField
    // struct.vendorFieldHex = this.vendorFieldHex // v2
    return struct
  }
}

module.exports = vendorField.mixin(TransferBuilder)
