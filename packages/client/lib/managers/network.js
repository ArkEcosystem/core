const _ = require('lodash')
const networks = require('../networks')

module.exports = class NetworkManager {
  /**
   * Get all network types.
   * @return {Object}
   */
  static getAll () {
    return networks
  }

  /**
   * Find network by coin and name.
   * @param  {String} name
   * @param  {String} [coin=ark]
   * @return {Object}
   */
  static findByName (name, coin = 'ark') {
    return _.get(networks, `${coin}.${name}`)
  }
}
