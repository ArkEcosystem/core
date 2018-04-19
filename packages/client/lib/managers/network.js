const _ = require('lodash')
const networks = require('../networks')

module.exports = class NetworkManager {
  /**
   * [getAll description]
   * @return {[type]} [description]
   */
  static getAll () {
    return networks
  }

  /**
   * [findByName description]
   * @param  {[type]} name [description]
   * @param  {String} coin [description]
   * @return {[type]}      [description]
   */
  static findByName (name, coin = 'ark') {
    return _.get(networks, `${coin}.${name}`)
  }
}
