const Base = require('../../base')

module.exports = class Blocks extends Base {
  /**
   * Get all blocks.
   * @return {Promise}
   */
  all () {
    return this.http.get('blocks')
  }

  /**
   * Get block by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get(`blocks/${id}`)
  }

  /**
   * Get transactions by block id.
   * @param  {String} id
   * @return {Promise}
   */
  transactions (id) {
    return this.http.get(`blocks/${id}/transactions`)
  }

  /**
   * Search for blocks.
   * @param  {Object} payload
   * @return {Promise}
   */
  search (payload) {
    return this.http.post('blocks/search', payload)
  }
}
