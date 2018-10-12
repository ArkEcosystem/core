const Base = require('../../base')

module.exports = class Delegates extends Base {
  /**
   * Get all delegates.
   * @param {Object} [query]
   * @return {Promise}
   */
  all (query) {
    return this.http.get('delegates', query)
  }

  /**
   * Get delegate by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get(`delegates/${id}`)
  }

  /**
   * Get blocks forged by delegate id.
   * @param  {String} id
   * @param {Object} [query]
   * @return {Promise}
   */
  blocks (id, query) {
    return this.http.get(`delegates/${id}/blocks`, query)
  }

  /**
   * Get voters by delegate id.
   * @param  {String} id
   * @param {Object} [query]
   * @return {Promise}
   */
  voters (id, query) {
    return this.http.get(`delegates/${id}/voters`, query)
  }
}
