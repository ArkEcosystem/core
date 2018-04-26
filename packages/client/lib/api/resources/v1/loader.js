const Base = require('../../base')

module.exports = class Loader extends Base {
  /**
   * Get network configuration.
   * @return {Promise}
   */
  status () {
    return this.http.get('loader/autoconfigure')
  }

  /**
   * Get node status.
   * @return {Promise}
   */
  syncing () {
    return this.http.get('loader/status')
  }

  /**
   * Get node syncing status.
   * @return {Promise}
   */
  configuration () {
    return this.http.get('loader/status/sync')
  }
}
