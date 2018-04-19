const _ = require('lodash')
const deepmerge = require('deepmerge')
const feeManager = require('./fee')
const { TRANSACTION_TYPES, CONFIGURATIONS } = require('../constants')
const defaultConfig = require('../networks/ark/devnet.json')

class ConfigManager {
  /**
   * [constructor description]
   * @return {[type]} [description]
   */
  constructor () {
    this.setConfig(defaultConfig)
  }

  /**
   * [setConfig description]
   * @param {Object} config [description]
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
   * [setFromFile description]
   * @param {String} path [description]
   */
  setFromFile (path) {
    this.setConfig(require(path))
  }

  /**
   * [setFromPreset description]
   * @param {String} path [description]
   */
  setFromPreset (coin, network) {
    this.setConfig(CONFIGURATIONS[coin.toUpperCase()][network.toUpperCase()])
  }

  /**
   * [all description]
   * @return {Object} [description]
   */
  all () {
    return this.config
  }

  /**
   * [set description]
   * @param {String} key   [description]
   * @param {[type]} value [description]
   */
  set (key, value) {
    this.config[key] = value
  }

  /**
   * [get description]
   * @param  {String} key [description]
   * @return {[type]}     [description]
   */
  get (key) {
    return this.config[key]
  }

  /**
   * [setHeight description]
   * @param {[type]} value [description]
   */
  setHeight (value) {
    this.height = value
  }

  /**
   * [getHeight description]
   * @return {[type]} [description]
   */
  getHeight () {
    return this.height
  }

  /**
   * [getConstant description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  getConstant (key) {
    return this.getConstants()[key]
  }

  /**
   * [getConstants description]
   * @param  {[type]} height [description]
   * @return {[type]}        [description]
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
   * [__buildConstants description]
   * @return {[type]} [description]
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
   * [__buildFees description]
   * @return {[type]} [description]
   */
  __buildFees () {
    Object
      .keys(TRANSACTION_TYPES)
      .forEach(type => feeManager.set(TRANSACTION_TYPES[type], this.getConstant('fees')[_.camelCase(type)]))
  }
}

module.exports = new ConfigManager()
