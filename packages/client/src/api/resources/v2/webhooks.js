const Base = require('../../base')

module.exports = class Webhooks extends Base {
  /**
   * [all description]
   * @return {[type]} [description]
   */
  all () {
    return this.http.get('webhooks')
  }

  /**
   * [create description]
   * @return {[type]} [description]
   */
  create () {
    return this.http.post('webhooks')
  }

  /**
   * [get description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return this.http.get(`webhooks/${id}`)
  }

  /**
   * [update description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  update (id) {
    return this.http.put(`webhooks/${id}`)
  }

  /**
   * [delete description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  delete (id) {
    return this.http.delete(`webhooks/${id}`)
  }

  /**
   * [events description]
   * @return {[type]} [description]
   */
  events () {
    return this.http.get('webhooks/events')
  }
}
