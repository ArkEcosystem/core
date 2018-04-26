const Base = require('../../base')

module.exports = class Webhooks extends Base {
  /**
   * Get all webhooks.
   * @return {Promise}
   */
  all () {
    return this.http.get('webhooks')
  }

  /**
   * Create webhooks.
   * @param  {Object} payload
   * @return {Promise}
   */
  create (payload) {
    return this.http.post('webhooks', payload)
  }

  /**
   * Get webhook by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get(`webhooks/${id}`)
  }

  /**
   * Update webhook by id.
   * @param  {String} id
   * @return {Promise}
   */
  update (id) {
    return this.http.put(`webhooks/${id}`)
  }

  /**
   * Delete webhook by id.
   * @param  {String} id
   * @return {Promise}
   */
  delete (id) {
    return this.http.delete(`webhooks/${id}`)
  }

  /**
   * Get webhook events.
   * @return {Promise}
   */
  events () {
    return this.http.get('webhooks/events')
  }
}
