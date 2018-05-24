const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')
const vendorField = require('./mixins/vendor-field')

class MultiPaymentBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.MULTI_PAYMENT
    this.fee = feeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT)
    this.payments = {}
    this.vendorFieldHex = null
  }

  /**
   * Add payment to the multipayment collection.
   * @param {String} address
   * @param {Number} amount
   * @return {MultiPaymentBuilder}
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
   * Overrides the inherited method to return the additional required by this.
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.senderPublicKey = this.senderPublicKey
    struct.vendorFieldHex = this.vendorFieldHex

    return Object.assign(struct, this.payments)
  }
}

module.exports = vendorField.mixin(MultiPaymentBuilder)
