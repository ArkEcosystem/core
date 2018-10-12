const Base = require('../../base')

module.exports = class Votes extends Base {
  /**
   * Get all votes.
   * @param {Object} [query]
   * @return {Promise}
   */
  all (query) {
    return this.http.get('votes', query)
  }

  /**
   * Get vote by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get(`votes/${id}`)
  }
}
