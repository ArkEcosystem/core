const get = require('lodash/get')
const networks = require('../networks')

module.exports = class NetworkManager {
  /**
   * Get all network types.
   * @return {Object}
   */
  static getAll() {
    return networks
  }

  /**
   * Find network by token and name.
   * @param  {String} name
   * @param  {String} [token=ark]
   * @return {Object}
   */
  static findByName(name, token = 'ark') {
    return get(networks, `${token.toLowerCase()}.${name}`)
  }
}
