const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')
const vendorField = require('./mixins/vendor-field')

class TimelockTransferBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.data.type = TRANSACTION_TYPES.TIMELOCK_TRANSFER
    this.data.fee = feeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)
    this.data.amount = 0
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.timelockType = 0x00
    this.data.timelock = null
  }

  /**
   * Overrides the inherited method to add the necessary parameters
   * @param  {String} recipientId
   * @param  {Number} amount
   * @param  {Number} timelock
   * @param  {Number} timelockType
   * @return {TimelockTransferBuilder}
   */
  create (recipientId, amount, timelock, timelockType) {
    this.data.recipientId = recipientId
    this.data.amount = amount
    this.data.timelock = timelock
    this.data.timelockType = timelockType
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.data.amount
    struct.recipientId = this.data.recipientId
    struct.vendorFieldHex = this.data.vendorFieldHex
    struct.asset = this.data.asset
    struct.timelock = this.data.timelock
    struct.timelockType = this.data.timelockType
    return struct
  }
}

module.exports = vendorField.mixin(TimelockTransferBuilder)
