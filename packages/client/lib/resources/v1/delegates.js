const Base = require('../../base')

module.exports = class Delegates extends Base {
  /**
   * Get all delegates.
   * @param  {Object} query
   * @return {Promise}
   */
  all (query) {
    return this.http.get('delegates', query)
  }

  /**
   * Get delegate by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get('delegates/get', { id })
  }

  /**
   * Get quantity of delegates.
   * @return {Promise}
   */
  count () {
    return this.http.get('delegates/count')
  }

  /**
   * Get delegate fee.
   * @return {Promise}
   */
  fee () {
    return this.http.get('delegates/fee')
  }

  /**
   * Get delegate forged data by public key.
   * @param  {String} generatorPublicKey
   * @return {Promise}
   */
  forged (generatorPublicKey) {
    return this.http.get('delegates/forging/getForgedByAccount', { generatorPublicKey })
  }

  /**
   * Search for delegates.
   * @param  {Object} query
   * @param  {String} query.q
   * @param  {Number} query.limit
   * @return {Promise}
   */
  search (query) {
    return this.http.get('delegates/search', query)
  }

  /**
   * Get voters for delegate.
   * @param  {String} publicKey
   * @return {Promise}
   */
  voters (publicKey) {
    return this.http.get('delegates/voters', { publicKey })
  }
}
