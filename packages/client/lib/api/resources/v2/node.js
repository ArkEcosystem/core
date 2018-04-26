const Base = require('../../base')

module.exports = class Node extends Base {
  /**
   * Get node status.
   * @return {Promise}
   */
  status () {
    return this.http.get('node/status')
  }

  /**
   * Get node syncing status.
   * @return {Promise}
   */
  syncing () {
    return this.http.get('node/syncing')
  }

  /**
   * Get node configuration.
   * @return {Promise}
   */
  configuration () {
    return this.http.get('node/configuration')
  }
}
