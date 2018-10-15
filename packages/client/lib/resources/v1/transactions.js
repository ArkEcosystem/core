const Base = require('../../base')

module.exports = class Transactions extends Base {
  /**
   * Get all transactions.
   * @param  {Object} query
   * @return {Promise}
   */
  all (query) {
    return this.http.get('transactions', query)
  }

  /**
   * Get transaction by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get('transactions/get', { id })
  }

  /**
   * Get all unconfirmed transactions.
   * @param  {Object} query
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
    return this.http.get('transactions/unconfirmed/get', { id })
  }
}
