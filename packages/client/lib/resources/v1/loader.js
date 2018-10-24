const Base = require('../../base')

module.exports = class Loader extends Base {
  /**
   * Get node syncing status.
   * @return {Promise}
   */
  status () {
    return this.http.get('loader/status/sync')
  }

  /**
   * Get node status.
   * @return {Promise}
   */
  syncing () {
    return this.http.get('loader/status')
  }

  /**
   * Get network configuration.
   * @return {Promise}
   */
  configuration () {
    return this.http.get('loader/autoconfigure')
  }
}
