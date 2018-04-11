const Base = require('../../base')

module.exports = class Blocks extends Base {
  /**
   * [all description]
   * @return {[type]} [description]
   */
  all () {
    return this.http.get('blocks')
  }

  /**
   * [get description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return this.http.get(`blocks/${id}`)
  }

  /**
   * [transactions description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  transactions (id) {
    return this.http.get(`blocks/${id}/transactions`)
  }

  /**
   * [search description]
   * @param  {[type]} payload [description]
   * @return {[type]}         [description]
   */
  search (payload) {
    return this.http.post('blocks/search', payload)
  }
}
