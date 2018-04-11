const Base = require('../../base')

module.exports = class Delegates extends Base {
  /**
   * [all description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  all (query) {
    return this.http.get('delegates', query)
  }

  /**
   * [get description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return this.http.get('delegates/get', {id})
  }

  /**
   * [count description]
   * @return {[type]} [description]
   */
  count () {
    return this.http.get('delegates/count')
  }

  /**
   * [fee description]
   * @return {[type]} [description]
   */
  fee () {
    return this.http.get('delegates/fee')
  }

  /**
   * [forged description]
   * @param  {String} generatorPublicKey [description]
   * @return {[type]}                    [description]
   */
  forged (generatorPublicKey) {
    return this.http.get('delegates/forging/getForgedByAccount', {generatorPublicKey})
  }

  /**
   * [search description]
   * @param  {Object} query [description]
   * @param  {String} query.q [description]
   * @param  {Number} query.limit [description]
   * @return {[type]}       [description]
   */
  search (query) {
    return this.http.get('delegates/search', query)
  }

  /**
   * [voters description]
   * @param  {String} publicKey [description]
   * @return {[type]}           [description]
   */
  voters (publicKey) {
    return this.http.get('delegates/voters', {publicKey})
  }
}
