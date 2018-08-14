const Base = require('../../base')

module.exports = class Blocks extends Base {
  /**
   * Get all blocks.
   * @param  {Object} query
   * @return {Promise}
   */
  all (query) {
    return this.http.get('blocks', query)
  }

  /**
   * Get block by id.
   * @param  {String} id
   * @return {Promise}
   */
  get (id) {
    return this.http.get('blocks/get', { id })
  }

  /**
   * Get epoch time from config.
   * @return {Promise}
   */
  epoch () {
    return this.http.get('blocks/getEpoch')
  }

  /**
   * Get the transfer fee from config.
   * @return {Promise}
   */
  fee () {
    return this.http.get('blocks/getFee')
  }

  /**
   * Get all fees from config.
   * @return {Promise}
   */
  fees () {
    return this.http.get('blocks/getFees')
  }

  /**
   * Get current height.
   * @return {Promise}
   */
  height () {
    return this.http.get('blocks/getHeight')
  }

  /**
   * Get current milestone.
   * @return {Promise}
   */
  milestone () {
    return this.http.get('blocks/getMilestone')
  }

  /**
   * Get nethash from config.
   * @return {Promise}
   */
  nethash () {
    return this.http.get('blocks/getNethash')
  }

  /**
   * Get reward from config.
   * @return {Promise}
   */
  reward () {
    return this.http.get('blocks/getReward')
  }

  /**
   * Get config/status for the network.
   * @return {Promise}
   */
  status () {
    return this.http.get('blocks/getStatus')
  }

  /**
   * Calculate network supply.
   * @return {Promise}
   */
  supply () {
    return this.http.get('blocks/getSupply')
  }
}
