const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const Transaction = require('./transaction')

module.exports = class Transfer extends Transaction {
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
   * @return {Transfer}
   */
  create (recipientId, amount) {
    this.recipientId = recipientId
    this.amount = amount
    return this
  }

  /**
   * Set vendor field from data.
   * @param {(String|undefined)} data
   * @param {Number}             type
   * @return {Transfer}
   */
  setVendorField (data) {
    this.vendorField = datas
    this.vendorFieldHex = Buffer.from(data, type).toString('hex') // v2
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
    struct.vendorFieldHex = this.vendorFieldHex // v2
    return struct
  }
}
