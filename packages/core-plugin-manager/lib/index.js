'use strict';

const path = require('path')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const Hoek = require('hoek')
const { createContainer, asValue } = require('awilix')

class PluginManager {
  /**
   * [init description]
   * @param  {[type]} plugins [description]
   * @param  {Object} options [description]
   * @return {[type]}         [description]
   */
  init (plugins, options = {}) {
    if (isString(plugins)) {
      plugins = require(path.resolve(expandHomeDir(`${plugins}/plugins.json`)))
    }

    this.plugins = plugins
    this.options = options
    this.container = createContainer()
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

    if (item.plugin.bindings) {
      for (const [bindingName, bindingValue] of Object.entries(item.plugin.bindings)) {
        this.container.register(bindingName, asValue(bindingValue))
      }
    }
  }

  /**
   * [get description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  get (key) {
    return this.container.resolve(key).plugin
  }

  /**
   * [config description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  config (key) {
    return this.container.resolve(key).options
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
