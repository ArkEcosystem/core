const NetworkManager = require('./managers/network')
const transactionBuilder = require('./builder')
const configManager = require('./managers/config')
const feeManager = require('./managers/fee')

module.exports = class Client {
  /**
   * @constructor
   * @param {Object} config
   */
  constructor (config) {
    this.setConfig(config || NetworkManager.findByName('devnet'))
  }

  /**
   * Set config for client.
   * @param {Object} config
   */
  setConfig (config) {
    configManager.setConfig(config)
  }

  /**
   * Get fee manager.
   * @return {FeeManager}
   */
  getFeeManager () {
    return feeManager
  }

  /**
   * Get config manager.
   * @return {ConfigManager}
   */
  getConfigManager () {
    return configManager
  }

  /**
   * Get transaction builder.
   * @return {TransactionBuilder}
   */
  getBuilder () {
    return transactionBuilder
  }
}
