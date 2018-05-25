const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')

module.exports = class TimelockTransferBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.TIMELOCK_TRANSFER
    this.fee = feeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.timelockType = 0x00
    this.timelock = null
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
    this.recipientId = recipientId
    this.amount = amount
    this.timelock = timelock
    this.timelockType = timelockType
    return this
  }

  /**
   * Set vendor field from data.
   * @param {(String|undefined)} data
   * @param {Number}             type
   * @return {TimelockTransferBuilder}
   */
  setVendorField (data, type) {
    this.vendorFieldHex = Buffer.from(data, type).toString('hex')
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
    struct.vendorFieldHex = this.vendorFieldHex
    struct.asset = this.asset
    struct.timelock = this.timelock
    struct.timelockType = this.timelockType
    return struct
  }
}
