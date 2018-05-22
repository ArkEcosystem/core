const Base = require('../../base')

module.exports = class Votes extends Base {
  /**
   * Get all votes.
   * @return {Promise}
   */
  all () {
    return this.http.get('votes')
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
