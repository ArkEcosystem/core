const ApiClient = require('./api')
const transactionBuilder = require('./builder')
const configManager = require('./managers/config')
const feeManager = require('./managers/fee')

class Client {
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

module.exports = new Client()
