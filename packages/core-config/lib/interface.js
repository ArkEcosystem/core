'use strict'

const deepmerge = require('deepmerge')
const ow = require('ow')

module.exports = class ConfigInterface {
  /**
   * Create a new config instance.
   * @param  {Object} options
   * @return {void}
   */
  constructor (options) {
    this.options = options
  }

  /**
   * Get constants for the specified height.
   * @param  {Number} height
   * @return {void}
   */
  getConstants (height) {
    while ((this.constant.index < this.constants.length - 1) && height >= this.constants[this.constant.index + 1].height) {
      this.constant.index++
      this.constant.data = this.constants[this.constant.index]
    }

    while (height < this.constants[this.constant.index].height) {
      this.constant.index--
      this.constant.data = this.constants[this.constant.index]
    }

    return this.constant.data
  }

  /**
   * Build constants from the config.
   * @return {void}
   */
  _buildConstants () {
    this.constants = this.network.constants.sort((a, b) => a.height - b.height)
    this.constant = {
      index: 0,
      data: this.constants[0]
    }

    let lastmerged = 0

    while (lastmerged < this.constants.length - 1) {
      this.constants[lastmerged + 1] = deepmerge(this.constants[lastmerged], this.constants[lastmerged + 1])
      lastmerged++
    }
  }

  /**
   * Expose some variables to the environment.
   * @return {void}
   */
  _exposeEnvironmentVariables () {
    process.env.ARK_NETWORK = this.network.name
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
    } catch(error) {
      console.error('Invalid configuration. Shutting down...')
      throw Error(error.message)
      process.exit(1)
    }
  }
}
