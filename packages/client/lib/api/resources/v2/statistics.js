const Base = require('../../base')

module.exports = class Statistics extends Base {
  /**
   * Get network statistics.
   * @return {Promise}
   */
  blockchain () {
    return this.http.get('statistics/blockchain')
  }

  /**
   * Get transaction statistics.
   * @return {Promise}
   */
  transactions () {
    return this.http.get('statistics/transactions')
  }

  /**
   * Get block statistics.
   * @return {Promise}
   */
  blocks () {
    return this.http.get('statistics/blocks')
  }

  /**
   * Get vote statistics.
   * @return {Promise}
   */
  votes () {
    return this.http.get('statistics/votes')
  }

  /**
   * Get unvote statistics.
   * @return {Promise}
   */
  unvotes () {
    return this.http.get('statistics/unvotes')
  }
}
