const Base = require('../../base')

module.exports = class Peers extends Base {
  /**
   * Get all peers.
   * @param  {Object} query
   * @return {Promise}
   */
  all (query) {
    return this.http.get('peers', query)
  }

  /**
   * Get peer by IP and Port.
   * @param  {String} ip
   * @param  {Number} port
   * @return {Promise}
   */
  get (ip, port) {
    return this.http.get('peers/get', { ip, port })
  }

  /**
   * Get peer version.
   * @return {Promise}
   */
  version () {
    return this.http.get('peers/version')
  }
}
