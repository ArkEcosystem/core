const Base = require('../../base')

module.exports = class Blocks extends Base {
  /**
   * [all description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  all (query) {
    return this.http.get('blocks', query)
  }

  /**
   * [get description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return this.http.get('blocks/get', {id})
  }

  /**
   * [epoch description]
   * @return {[type]} [description]
   */
  epoch () {
    return this.http.get('blocks/getEpoch')
  }

  /**
   * [fee description]
   * @return {[type]} [description]
   */
  fee () {
    return this.http.get('blocks/getFee')
  }

  /**
   * [fees description]
   * @return {[type]} [description]
   */
  fees () {
    return this.http.get('blocks/getFees')
  }

  /**
   * [height description]
   * @return {[type]} [description]
   */
  height () {
    return this.http.get('blocks/getHeight')
  }

  /**
   * [milestone description]
   * @return {[type]} [description]
   */
  milestone () {
    return this.http.get('blocks/getMilestone')
  }

  /**
   * [nethash description]
   * @return {[type]} [description]
   */
  nethash () {
    return this.http.get('blocks/getNethash')
  }

  /**
   * [reward description]
   * @return {[type]} [description]
   */
  reward () {
    return this.http.get('blocks/getReward')
  }

  /**
   * [status description]
   * @return {[type]} [description]
   */
  status () {
    return this.http.get('blocks/getStatus')
  }

  /**
   * [supply description]
   * @return {[type]} [description]
   */
  supply () {
    return this.http.get('blocks/getSupply')
  }
}
