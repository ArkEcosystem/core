const Base = require('../../base')

module.exports = class Wallets extends Base {
  /**
   * [all description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  all (query) {
    return this.http.get('accounts/getAllAccounts', query)
  }

  /**
   * [get description]
   * @param  {String} address [description]
   * @return {[type]}         [description]
   */
  get (address) {
    return this.http.get('accounts', {address})
  }

  /**
   * [count description]
   * @return {[type]} [description]
   */
  count () {
    return this.http.get('accounts/count')
  }

  /**
   * [delegates description]
   * @param  {String} address [description]
   * @return {[type]}         [description]
   */
  delegates (address) {
    return this.http.get('accounts/delegates', {address})
  }

  /**
   * [fee description]
   * @return {[type]} [description]
   */
  fee () {
    return this.http.get('accounts/delegates/fee')
  }

  /**
   * [balance description]
   * @param  {String} address [description]
   * @return {[type]}         [description]
   */
  balance (address) {
    return this.http.get('accounts/getBalance', {address})
  }

  /**
   * [publicKey description]
   * @param  {String} address [description]
   * @return {[type]}         [description]
   */
  publicKey (address) {
    return this.http.get('accounts/getPublicKey', {address})
  }

  /**
   * [top description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  top (query) {
    return this.http.get('accounts/top', query)
  }
}
