const Base = require('../../base')

module.exports = class Transactions extends Base {
  /**
   * Get all transactions.
   * @return {Promise}
   */
  all () {
    return this.http.get('transactions')
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
   * @return {Promise}
   */
  allUnconfirmed () {
    return this.http.get('transactions/unconfirmed')
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
