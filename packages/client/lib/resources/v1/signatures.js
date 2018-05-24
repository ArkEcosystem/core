const Base = require('../../base')

module.exports = class Signatures extends Base {
  /**
   * Get signature fee.
   * @return {Promise}
   */
  fee () {
    return this.http.get('signatures/fee')
  }
}
