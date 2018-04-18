const Base = require('../../base')

module.exports = class Loader extends Base {
  /**
   * [status description]
   * @return {[type]} [description]
   */
  status () {
    return this.http.get('loader/autoconfigure')
  }

  /**
   * [syncing description]
   * @return {[type]} [description]
   */
  syncing () {
    return this.http.get('loader/status')
  }

  /**
   * [configuration description]
   * @return {[type]} [description]
   */
  configuration () {
    return this.http.get('loader/status/sync')
  }
}
