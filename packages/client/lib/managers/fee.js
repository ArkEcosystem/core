const { TRANSACTION_TYPES } = require('../constants')

class FeeManager {
  /**
   * @constructor
   * @return {[type]} [description]
   */
  constructor () {
    this.fees = {}
  }

  /**
   * [set description]
   * @param {[type]} type  [description]
   * @param {[type]} value [description]
   */
  set (type, value) {
    if (!this.__validType(type)) {
      throw new Error('Invalid transaction type.')
    }

    this.fees[type] = value
  }

  /**
   * [get description]
   * @param  {[type]} type  [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
   */
  get (type, value) {
    return this.fees[type]
  }

  /**
   * [__validType description]
   * @param  {[type]} type [description]
   * @return {[type]}      [description]
   */
  __validType (type) {
    return Object.values(TRANSACTION_TYPES).indexOf(type) > -1
  }
}

module.exports = new FeeManager()
