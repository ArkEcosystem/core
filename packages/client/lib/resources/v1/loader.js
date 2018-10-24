const Base = require('../../base')

module.exports = class Loader extends Base {
  /**
   * Get node status.
   * @return {Promise}
   */
  status () {
    return this.http.get('loader/status')
  }

  /**
   * Get node syncing status.
   * @return {Promise}
   */
  syncing () {
    return this.http.get('loader/status/sync')
  }

  /**
   * Get network configuration.
   * @return {Promise}
   */
  configuration () {
    return this.http.get('loader/autoconfigure')
  }
}
