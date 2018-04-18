'use strict';

const path = require('path')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const Hoek = require('hoek')

class PluginManager {
  /**
   * [init description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  init (config) {
    if (isString(config)) {
      config = require(path.resolve(expandHomeDir(`${config}/plugins.json`)))
    }

    this.config = config

    this.plugins = {}
    this.bindings = {}
  }

  /**
   * [hook description]
   * @param  {[type]} name [description]
   * @return {[type]}      [description]
   */
  async hook (name, options = {}) {
    for (let [pluginName, pluginOptions] of Object.entries(this.config[name])) {
      pluginOptions = Hoek.applyToDefaults(pluginOptions, options)

      await this.register(pluginName, pluginOptions, name)
    }
  }

  /**
   * [register description]
   * @param  {[type]} plugin  [description]
   * @param  {Object} options [description]
   * @param  {String} hook    [description]
   * @return {[type]}         [description]
   */
  async register (plugin, options = {}, hook = 'default') {
    // Alias...
    let item

    // Make sure we have an instance...
    if (isString(plugin)) {
      if (!plugin.startsWith('@')) {
        plugin = path.resolve(plugin)
      }

      item = require(plugin)

      if (!item.plugin) {
        item = { plugin: item }
      }
    }

    // Variables...
    const name = item.plugin.name || item.plugin.pkg.name
    const version = item.plugin.version || item.plugin.pkg.version
    const defaults = item.plugin.defaults || item.plugin.pkg.defaults
    const alias = item.plugin.alias || item.plugin.pkg.alias

    // No registration, probably a sub-plugin...
    if (!item.plugin.register) {
      return false
    }

    // Merge default options...
    if (defaults) {
      options = Hoek.applyToDefaults(defaults, options)
    }

    // Register...
    const instance = await item.plugin.register(this, hook, options || {})
    this.plugins[name] = { name, version, plugin: instance, options }

    // Register with alias...
    if (alias) {
      this.plugins[alias] = this.plugins[name]
      delete this.plugins[name]
    }

    // Register bindings...
    if (item.plugin.bindings) {
      for (const [bindingName, bindingValue] of Object.entries(item.plugin.bindings)) {
        this.bindings[bindingName] = bindingValue
      }
    }
  }

  /**
   * [get description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  get (key) {
    return this.plugins[key].plugin
  }

  /**
   * [has description]
   * @param  {[type]}  key [description]
   * @return {Boolean}     [description]
   */
  has (key) {
    return this.plugins.hasOwnProperty(key)
  }

  /**
   * [config description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  config (key) {
    return this.plugins[key].options
  }

  /**
   * [hasOptions description]
   * @param  {[type]}  key [description]
   * @return {Boolean}     [description]
   */
  hasOptions (key) {
    return this.plugins[key].hasOwnProperty('options')
  }

  /**
   * [binding description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  binding (key) {
    return this.bindings[key]
  }

  /**
   * [hasBinding description]
   * @param  {[type]}  key [description]
   * @return {Boolean}     [description]
   */
  hasBinding (key) {
    return this.bindings.hasOwnProperty(key)
  }
}

/**
 * [exports description]
 * @type {PluginManager}
 */
module.exports = new PluginManager()
