const Base = require('../../base')

module.exports = class Delegates extends Base {
  /**
   * Get all delegates.
   * @return {Promise}
   */
  all () {
    return this.http.get('delegates')
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
   * @return {Promise}
   */
  blocks (id) {
    return this.http.get(`delegates/${id}/blocks`)
  }

  /**
   * Get voters by delegate id.
   * @param  {String} id
   * @return {Promise}
   */
  voters (id) {
    return this.http.get(`delegates/${id}/voters`)
  }
}
