const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')

module.exports = class DelegateResignationBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.data.type = TRANSACTION_TYPES.DELEGATE_RESIGNATION
    this.data.fee = feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION)
  }
}
