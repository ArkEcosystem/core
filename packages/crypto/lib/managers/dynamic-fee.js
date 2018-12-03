const { TRANSACTION_TYPES } = require('../constants')

class DynamicFeeManager {
  /**
   * @constructor
   */
  constructor() {
    this.offsets = {}
  }

  /**
   * Calculate minimum fee of a transaction for entering the pool.
   * @param {Number} Minimum fee ARKTOSHI/byte
   * @param {Transaction} Transaction for which we calculate the fee
   * @returns {Number} Calculated minimum acceptable fee in ARKTOSHI
   */
  calculateFee(arktoshiPerByte, transaction) {
    if (arktoshiPerByte <= 0) {
      arktoshiPerByte = 1
    }

    // serialized is in hex
    const transactionSizeInBytes = transaction.serialized.length / 2

    return (
      (this.get(transaction.type) + transactionSizeInBytes) * arktoshiPerByte
    )
  }

  /**
   * Get offsset value based on transaction.
   * @param  {Number} type
   * @return {Number}
   */
  get(type) {
    return this.offsets[type]
  }

  /**
   * Set offset value based on type.
   * @param {Number} type
   * @param {Number} value
   */
  set(type, value) {
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
  __validType(type) {
    return Object.values(TRANSACTION_TYPES).indexOf(type) > -1
  }
}

module.exports = new DynamicFeeManager()
