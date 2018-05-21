const { TRANSACTION_TYPES } = require('../constants')

class DynamicFeeManager {
  /**
   * @constructor
   */
  constructor () {
    this.offsets = {}
    this.__setDefaultOffsetValues()
  }

  /** Calculates delegate fee for processing and forging if transaction
  * @param {Number} ARKTOSHI fee price per byte as set by forger/delegate
  * @returns {Number} ARKTOSHI calculated dynamic fee
  */
  static calculateFee (feeMultiplier, transaction) {
    if (feeMultiplier === 0) {
      feeMultiplier = 1
    }

    return (this.__getOffset(transaction.type) + (this.serialized.length)) * feeMultiplier
  }

  /**
   * Get offsset value based on transaction.
   * @param  {Number} type
   * @return {Number}
   */
  __getOffset (type) {
    return this.offsets[type]
  }

  /**
   * Set offset value based on type.
   * @param {Number} type
   * @param {Number} value
   */
  __setOffset (type, value) {
    if (!this.__validType(type)) {
      throw new Error('Invalid transaction type.')
    }

    this.offsets[type] = value
  }

  /**
   * Ensure transaction type is valid.
   * @param  {Number} type
   * @return {Boolean}
   */
  __validType (type) {
    return Object.values(TRANSACTION_TYPES).indexOf(type) > -1
  }

  __setDefaultOffsetValues () {
    this.__setOffset(TRANSACTION_TYPES.TRANSFER, 100)
    this.__setOffset(TRANSACTION_TYPES.SECOND_SIGNATURE, 500)
    this.__setOffset(TRANSACTION_TYPES.VOTE, 100)
    this.__setOffset(TRANSACTION_TYPES.MULTI_SIGNATURE, 100)
    this.__setOffset(TRANSACTION_TYPES.IPFS, 250)
    this.__setOffset(TRANSACTION_TYPES.TIMELOCK_TRANSFER, 500)
    this.__setOffset(TRANSACTION_TYPES.MULTI_PAYMENT, 500)
    this.__setOffset(TRANSACTION_TYPES.DELEGATE_RESIGNATION, 500)
  }
}

module.exports = new DynamicFeeManager()
