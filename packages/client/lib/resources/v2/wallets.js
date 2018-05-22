const Base = require('../../base')

module.exports = class Wallets extends Base {
  /**
   * Get all wallets.
   * @return {Promise}
   */
  all () {
    return this.http.get('wallets')
  }

  /**
   * Get top wallets.
   * @return {Promise}
   */
  top () {
    return this.http.get('wallets/top')
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
   * @return {Promise}
   */
  transactions (id) {
    return this.http.get(`wallets/${id}/transactions`)
  }

  /**
   * Get sent transactions by wallet id.
   * @param  {String} id
   * @return {Promise}
   */
  transactionsSent (id) {
    return this.http.get(`wallets/${id}/transactions/sent`)
  }

  /**
   * Get received transactions by wallet id.
   * @param  {String} id
   * @return {Promise}
   */
  transactionsReceived (id) {
    return this.http.get(`wallets/${id}/transactions/received`)
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
