'use strict'

const { configManager } = require('@arkecosystem/crypto')
const ow = require('ow')

module.exports = class ConfigInterface {
  /**
   * Create a new config instance.
   * @param  {Object} options
   * @return {void}
   */
  constructor (options) {
    this.options = options
    this.network = JSON.parse(process.env.ARK_NETWORK)
  }

  /**
   * Get constants for the specified height.
   * @param  {Number} height
   * @return {void}
   */
  getConstants (height) {
    return configManager.getConstants(height)
  }

  /**
   * Build constants from the config.
   * @return {void}
   */
  buildConstants () {
    configManager.buildConstants()
  }

  /**
   * Validate crucial parts of the configuration.
   * @return {void}
   */
  _validateConfig () {
    try {
      ow(this.network.pubKeyHash, ow.number)
      ow(this.network.nethash, ow.string.length(64))
      ow(this.network.wif, ow.number)
    } catch (error) {
      console.error('Invalid configuration. Shutting down...')
      throw Error(error.message)
      process.exit(1) // eslint-disable-line no-unreachable
    }
  }
}
