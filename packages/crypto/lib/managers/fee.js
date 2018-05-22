const { TRANSACTION_TYPES } = require('../constants')

class FeeManager {
  /**
   * @constructor
   */
  constructor () {
    this.fees = {}
  }

  /**
   * Set fee value based on type.
   * @param {Number} type
   * @param {Number} value
   */
  set (type, value) {
    if (!this.__validType(type)) {
      throw new Error('Invalid transaction type.')
    }

    this.fees[type] = value
  }

  /**
   * Get fee value based on type.
   * @param  {Number} type
   * @return {Number}
   */
  get (type) {
    return this.fees[type]
  }

  /**
   * Ensure fee type is valid.
   * @param  {Number} type
   * @return {Boolean}
   */
  __validType (type) {
    return Object.values(TRANSACTION_TYPES).indexOf(type) > -1
  }
}

module.exports = new FeeManager()
