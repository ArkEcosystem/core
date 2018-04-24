'use strict';

const path = require('path')
const fs = require('fs')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const Hoek = require('hoek')
const { createContainer, asValue } = require('awilix')

class PluginManager {
  /**
   * [constructor description]
   * @return {[type]} [description]
   */
  constructor () {
    this.container = createContainer()
  }

  /**
   * [init description]
   * @param  {[type]} config  [description]
   * @param  {Object} options [description]
   * @return {[type]}         [description]
   */
  init (config, options = {}) {
    const plugins = path.resolve(expandHomeDir(`${config}/plugins.js`))

    if (!fs.existsSync(plugins)) {
      throw new Error('An invalid configuration was provided or is inaccessible due to it\'s security settings.')
      process.exit(1) // eslint-disable-line no-unreachable
    }

    this.plugins = require(plugins)
    this.options = options
  }

  /**
   * [hook description]
   * @param  {[type]} name [description]
   * @return {[type]}      [description]
   */
  async hook (name, options = {}) {
    for (let [pluginName, pluginOptions] of Object.entries(this.plugins[name])) {
      if (this.__shouldBeRegistered(pluginName)) {
        await this.register(pluginName, Hoek.applyToDefaults(pluginOptions, options))
      }
    }
  }

  /**
   * [register description]
   * @param  {[type]} plugin  [description]
   * @param  {Object} options [description]
   * @return {[type]}         [description]
   */
  async register (plugin, options = {}) {
    let item = this.__resolvePlugin(plugin)

    if (!item.plugin.register) return

    const name = item.plugin.name || item.plugin.pkg.name
    const version = item.plugin.version || item.plugin.pkg.version
    const defaults = item.plugin.defaults || item.plugin.pkg.defaults
    const alias = item.plugin.alias || item.plugin.pkg.alias

    if (defaults) options = Hoek.applyToDefaults(defaults, options)

    const instance = await item.plugin.register(this, options || {})
    this.container.register(alias || name, asValue({ name, version, plugin: instance, options }))
  }

  /**
   * [get description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  get (key) {
    try {
      return this.container.resolve(key).plugin
    } catch (err) {
      throw new Error(err.message)
    }
  }

  /**
   * [has description]
   * @param  {[type]}  key [description]
   * @return {Boolean}     [description]
   */
  has (key) {
    try {
      return this.container.resolve(key)
    } catch (err) {
      return false
    }
  }

  /**
   * [config description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  config (key) {
    try {
      return this.container.resolve(key).options
    } catch (err) {
      throw new Error(`The service "${key}" is not available.`)
    }
  }

  /**
   * [__resolvePlugin description]
   * @param  {[type]} plugin [description]
   * @return {[type]}        [description]
   */
  __resolvePlugin (plugin) {
    let item

    if (isString(plugin)) {
      if (!plugin.startsWith('@')) {
        plugin = path.resolve(plugin)
      }

      item = require(plugin)

      if (!item.plugin) {
        item = { plugin: item }
      }
    }

    return item
  }

  /**
   * [__shouldBeRegistered description]
   * @param  {[type]} name [description]
   * @return {[type]}      [description]
   */
  __shouldBeRegistered (name) {
    let register = true

    if (this.options.include) {
      register = this.options.include.includes(name)
    }

    if (this.options.exclude) {
      register = !this.options.exclude.includes(name)
    }

    return register
  }
}

/**
 * [exports description]
 * @type {PluginManager}
 */
module.exports = new PluginManager()
