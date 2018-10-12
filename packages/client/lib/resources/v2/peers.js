const Base = require('../../base')

module.exports = class Peers extends Base {
  /**
   * Get all peers.
   * @param {Object} [query]
   * @return {Promise}
   */
  all (query) {
    return this.http.get('peers', query)
  }

  /**
   * Get peer by ip.
   * @param  {String} ip
   * @return {Promise}
   */
  get (ip) {
    return this.http.get(`peers/${ip}`)
  }
}
