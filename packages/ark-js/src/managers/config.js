import _ from 'lodash'
import deepmerge from 'deepmerge'
import feeManager from '@/managers/fee'
import { TRANSACTION_TYPES } from '@/constants'

class ConfigManager {
  /**
   * [setConfig description]
   * @param {Object} config [description]
   */
  setConfig (config) {
    this.config = {}

    for (const [key, value] of Object.entries(config)) {
      this.config[key] = value
    }

    this._buildConstants()
    this._buildFees()
  }

  /**
   * [setFromFile description]
   * @param {String} path [description]
   */
  setFromFile (path) {
    this.setConfig(require(path))
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
   * [_buildConstants description]
   * @return {[type]} [description]
   */
  _buildConstants () {
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
   * [_buildFees description]
   * @return {[type]} [description]
   */
  _buildFees () {
    Object
      .keys(TRANSACTION_TYPES)
      .forEach(type => feeManager.set(TRANSACTION_TYPES[type], this.getConstant('fees')[_.camelCase(type)]))
  }
}

export default new ConfigManager()
