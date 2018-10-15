const Base = require('../../base')

module.exports = class Wallets extends Base {
  /**
   * Get all wallets.
   * @param  {Object} query
   * @return {Promise}
   */
  all (query) {
    return this.http.get('accounts/getAllAccounts', query)
  }

  /**
   * Get a wallet by address.
   * @param  {String} address
   * @return {Promise}
   */
  get (address) {
    return this.http.get('accounts', { address })
  }

  /**
   * Count how many wallets there are.
   * @return {Promise}
   */
  count () {
    return this.http.get('accounts/count')
  }

  /**
   * Get deletate by address.
   * @param  {String} address
   * @return {Promise}
   */
  delegates (address) {
    return this.http.get('accounts/delegates', { address })
  }

  /**
   * Get delegate fees.
   * @return {Promise}
   */
  fee () {
    return this.http.get('accounts/delegates/fee')
  }

  /**
   * Get wallet balance by Address.
   * @param  {String} address
   * @return {Promise}
   */
  balance (address) {
    return this.http.get('accounts/getBalance', { address })
  }

  /**
   * Get wallet public key by Address.
   * @param  {String} address
   * @return {Promise}
   */
  publicKey (address) {
    return this.http.get('accounts/getPublicKey', { address })
  }

  /**
   * Get the top wallets.
   * @param  {Object} query
   * @return {Promise}
   */
  top (query) {
    return this.http.get('accounts/top', query)
  }
}
