const Base = require('../../base')

module.exports = class Peers extends Base {
  /**
   * [all description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  all (query) {
    return this.http.get('peers', query)
  }

  /**
   * [get description]
   * @param  {String} ip   [description]
   * @param  {Number} port [description]
   * @return {[type]}      [description]
   */
  get (ip, port) {
    return this.http.get('peers/get', {ip, port})
  }

  /**
   * [version description]
   * @return {[type]} [description]
   */
  version () {
    return this.http.get('peers/version')
  }
}
