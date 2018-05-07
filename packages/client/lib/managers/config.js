const _ = require('lodash')
const deepmerge = require('deepmerge')
const feeManager = require('./fee')
const { TRANSACTION_TYPES, CONFIGURATIONS } = require('../constants')
const defaultConfig = require('../networks/ark/devnet.json')

class ConfigManager {
  /**
   * @constructor
   */
  constructor () {
    this.setConfig(defaultConfig)
  }

  /**
   * Set config data.
   * @param {Object} config
   */
  setConfig (config) {
    this.config = {}

    for (const [key, value] of Object.entries(config)) {
      this.config[key] = value
    }

    this.__buildConstants()
    this.__buildFees()
  }

  /**
   * Get config from file.
   * @param {String} path
   */
  setFromFile (path) {
    this.setConfig(require(path))
  }

  /**
   * Get config from preset configurations.
   * @param {String} coin
   * @param {String} network
   */
  setFromPreset (coin, network) {
    this.setConfig(CONFIGURATIONS[coin.toUpperCase()][network.toUpperCase()])
  }

  /**
   * Get all config data.
   * @return {Object}
   */
  all () {
    return this.config
  }

  /**
   * Set individual config value.
   * @param {String} key
   * @param {*}      value
   */
  set (key, value) {
    this.config[key] = value
  }

  /**
   * Get specific config value.
   * @param  {String} key
   * @return {*}
   */
  get (key) {
    return this.config[key]
  }

  /**
   * Set config manager height.
   * @param {Number} value
   */
  setHeight (value) {
    this.height = value
  }

  /**
   * Get config manager height.
   * @return {Number}
   */
  getHeight () {
    return this.height
  }

  /**
   * Get specific config constant based on height 1.
   * @param  {String} key
   * @return {*}
   */
  getConstant (key) {
    return this.getConstants()[key]
  }

  /**
   * Get all config constants based on height.
   * @param  {(Number|undefined)} height
   * @return {*}
   */
  getConstants (height) {
    if (this.height) {
      height = this.height
    }

    if (!height) {
      height = 1
    }

    while ((this.current.index < this.constants.length - 1) && height >= this.constants[this.current.index + 1].height) {
      this.current.index++
      this.current.data = this.constants[this.current.index]
    }

    while (height < this.constants[this.current.index].height) {
      this.current.index--
      this.current.data = this.constants[this.current.index]
    }

    return this.current.data
  }

  /**
   * Build constant data based on active heights.
   */
  __buildConstants () {
    this.constants = this.config.constants.sort((a, b) => a.height - b.height)
    this.current = {
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
   * Build fees from config constants.
   */
  __buildFees () {
    Object
      .keys(TRANSACTION_TYPES)
      .forEach(type => feeManager.set(TRANSACTION_TYPES[type], this.getConstant('fees')[_.camelCase(type)]))
  }
}

module.exports = new ConfigManager()
