const Base = require('../../base')

module.exports = class Delegates extends Base {
  /**
   * [all description]
   * @return {[type]} [description]
   */
  all () {
    return this.http.get('delegates')
  }

  /**
   * [get description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return this.http.get(`delegates/${id}`)
  }

  /**
   * [blocks description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  blocks (id) {
    return this.http.get(`delegates/${id}/blocks`)
  }

  /**
   * [voters description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  voters (id) {
    return this.http.get(`delegates/${id}/voters`)
  }
}
