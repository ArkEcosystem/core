const Base = require('../../base')

module.exports = class Transactions extends Base {
  /**
   * Get all transactions.
   * @param {Object} [query]
   * @return {Promise}
   */
  all (query) {
    return this.http.get('transactions', query)
  }

  /**
   * Push transactions to the blockchain.
   * @param  {Object} payload
   * @return {Promise}
   */
  create (payload) {
    return this.http.post('transactions', payload)
  }

  /**
   * Get transaction by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get(`transactions/${id}`)
  }

  /**
   * Get all unconfirmed transactions.
   * @param {Object} [query]
   * @return {Promise}
   */
  allUnconfirmed (query) {
    return this.http.get('transactions/unconfirmed', query)
  }

  /**
   * Get unconfirmed transaction by id.
   * @param  {String} id
   * @return {Promise}
   */
  getUnconfirmed (id) {
    return this.http.get(`transactions/unconfirmed/${id}`)
  }

  /**
   * Search for transactions.
   * @param  {Object} payload
   * @return {Promise}
   */
  search (payload) {
    return this.http.post('transactions/search', payload)
  }

  /**
   * Get transaction types.
   * @return {Promise}
   */
  types () {
    return this.http.get('transactions/types')
  }
}
