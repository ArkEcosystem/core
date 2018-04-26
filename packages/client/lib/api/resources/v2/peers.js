const Base = require('../../base')

module.exports = class Peers extends Base {
  /**
   * Get all peers.
   * @return {Promise}
   */
  all () {
    return this.http.get('peers')
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
