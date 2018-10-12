const Base = require('../../base')

module.exports = class Blocks extends Base {
  /**
   * Get all blocks.
   * @param {Object} [query]
   * @return {Promise}
   */
  all (query) {
    return this.http.get('blocks', query)
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
   * @param {Object} [query]
   * @return {Promise}
   */
  transactions (id, query) {
    return this.http.get(`blocks/${id}/transactions`, query)
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
