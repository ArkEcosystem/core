const Base = require('../../base')

module.exports = class Peers extends Base {
  /**
   * [all description]
   * @return {[type]} [description]
   */
  all () {
    return this.http.get('peers')
  }

  /**
   * [get description]
   * @param  {String} ip [description]
   * @return {[type]}    [description]
   */
  get (ip) {
    return this.http.get(`peers/${ip}`)
  }
}
