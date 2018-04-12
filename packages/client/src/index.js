const ApiClient = require('./api')
const transactionBuilder = require('./builder')
const configManager = require('./managers/config')
const feeManager = require('./managers/fee')
const defaultConfig = require('./networks/ark/devnet.json')

module.exports = class Ark {
  /**
   * [constructor description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  constructor (config) {
    this.setConfig(config || defaultConfig)
  }

  /**
   * [setConfig description]
   * @param {[type]} config [description]
   */
  setConfig (config) {
    configManager.setConfig(config)
  }

  /**
   * [getFeeManager description]
   * @return {[type]} [description]
   */
  getFeeManager () {
    return feeManager
  }

  /**
   * [getConfigManager description]
   * @return {[type]} [description]
   */
  getConfigManager () {
    return configManager
  }

  /**
   * [getBuilder description]
   * @return {[type]} [description]
   */
  getBuilder () {
    return transactionBuilder
  }

  /**
   * [getClient description]
   * @param  {[type]} host [description]
   * @return {[type]}      [description]
   */
  getClient (host) {
    return new ApiClient(host)
  }
}
