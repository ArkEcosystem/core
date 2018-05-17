const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const Transaction = require('./transaction')

module.exports = class DelegateResignation extends Transaction {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.DELEGATE_RESIGNATION
    this.fee = feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION)
  }
}
