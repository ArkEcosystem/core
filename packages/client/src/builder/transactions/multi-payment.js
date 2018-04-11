const feeManager = require('../../managers/fee')
const Transaction = require('../transaction')
const { TRANSACTION_TYPES } = require('../../constants')

module.exports = class MultiPayment extends Transaction {
  /**
   * @constructor
   * @return {[type]} [description]
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.MULTI_PAYMENT
    this.fee = feeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT)
    this.payments = {}
    this.vendorFieldHex = null
  }

  /**
   * [setVendorField description]
   * @param {[type]} data [description]
   * @param {[type]} type [description]
   */
  setVendorField (data, type) {
    this.vendorFieldHex = Buffer.from(data, type).toString('hex')
    return this
  }

  /**
   * [addPayment description]
   * @param {[type]} address [description]
   * @param {[type]} amount  [description]
   */
  addPayment (address, amount) {
    const paymentsCount = Object.keys(this.payments).length / 2

    if (paymentsCount >= 2258) {
      throw new Error('A maximum of 2259 outputs is allowed')
    }

    const key = paymentsCount + 1
    this.payments[`address${key}`] = address
    this.payments[`amount${key}`] = amount
    return this
  }

  /**
   * [getStruct description]
   * Overrides the inherited method to return the additional required by this
   * @return {Object} [description]
   */
  getStruct () {
    const struct = super.getStruct()
    struct.senderPublicKey = this.senderPublicKey
    struct.vendorFieldHex = this.vendorFieldHex
    return Object.assign(struct, this.payments)
  }
}
