const Base = require('../../base')

module.exports = class Signatures extends Base {
  /**
   * [fee description]
   * @return {[type]} [description]
   */
  fee () {
    return this.http.get('signatures/fee')
  }
}
