const Base = require('../../base')

module.exports = class Wallets extends Base {
  /**
   * Get all wallets.
   * @param {Object} [query]
   * @return {Promise}
   */
  all (query) {
    return this.http.get('wallets', query)
  }

  /**
   * Get top wallets.
   * @param {Object} [query]
   * @return {Promise}
   */
  top (query) {
    return this.http.get('wallets/top', query)
  }

  /**
   * Get wallet by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get(`wallets/${id}`)
  }

  /**
   * Get transactions by wallet id.
   * @param  {String} id
   * @param {Object} [query]
   * @return {Promise}
   */
  transactions (id, query) {
    return this.http.get(`wallets/${id}/transactions`, query)
  }

  /**
   * Get sent transactions by wallet id.
   * @param  {String} id
   * @param {Object} [query]
   * @return {Promise}
   */
  transactionsSent (id, query) {
    return this.http.get(`wallets/${id}/transactions/sent`, query)
  }

  /**
   * Get received transactions by wallet id.
   * @param  {String} id
   * @param {Object} [query]
   * @return {Promise}
   */
  transactionsReceived (id, query) {
    return this.http.get(`wallets/${id}/transactions/received`, query)
  }

  /**
   * Get votes by wallet id.
   * @param  {String} id
   * @return {Promise}
   */
  votes (id) {
    return this.http.get(`wallets/${id}/votes`)
  }

  /**
   * Search for wallets.
   * @param  {Object} payload
   * @return {Promise}
   */
  search (payload) {
    return this.http.post('wallets/search', payload)
  }
}
