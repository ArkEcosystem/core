'use strict'

const deepmerge = require('deepmerge')

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
}
