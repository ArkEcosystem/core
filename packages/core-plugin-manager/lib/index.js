'use strict'

const path = require('path')
const fs = require('fs')
const semver = require('semver')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const Hoek = require('hoek')
const { createContainer, asValue } = require('awilix')

class PluginManager {
  /**
   * Create a new plugin manager instance.
   * @constructor
   */
  constructor () {
    this.container = createContainer()
  }

  /**
   * Initialise the plugin manager.
   * @param  {Object} paths
   * @param  {Object} options
   * @return {void}
   */
  init (paths, options = {}) {
    this.__exportPaths(paths)

    const plugins = path.resolve(expandHomeDir(`${process.env.ARK_PATH_CONFIG}/plugins.js`))

    if (!fs.existsSync(plugins)) {
      throw new Error('An invalid configuration was provided or is inaccessible due to it\'s security settings.')
      process.exit(1) // eslint-disable-line no-unreachable
    }

    this.plugins = require(plugins)
    this.options = options
  }

  /**
   * Register a hook.
   * @param  {String} name
   * @param  {Object} options
   * @return {void}
   */
  async hook (name, options = {}) {
    for (let [pluginName, pluginOptions] of Object.entries(this.plugins[name])) {
      if (this.__shouldBeRegistered(pluginName)) {
        await this.register(pluginName, Hoek.applyToDefaults(pluginOptions, options))
      }
    }
  }

  /**
   * Register a plugin.
   * @param  {Object} plugin
   * @param  {Object} options
   * @return {void}
   */
  async register (plugin, options = {}) {
    let item = this.__resolvePlugin(plugin)

    if (!item.plugin.register) return

    const name = item.plugin.name || item.plugin.pkg.name
    const version = item.plugin.version || item.plugin.pkg.version
    const defaults = item.plugin.defaults || item.plugin.pkg.defaults
    const alias = item.plugin.alias || item.plugin.pkg.alias

    if (!semver.valid(version)) {
      throw new Error(`The plugin "${name}" provided an invalid version "${version}". Please check https://semver.org/ and make sure you follow the spec.`)
    }

    if (defaults) {
      options = Hoek.applyToDefaults(defaults, options)
    }

    if (this.options.options && this.options.options.hasOwnProperty(name)) {
      options = Hoek.applyToDefaults(options, this.options.options[name])
    }

    plugin = await item.plugin.register(this, options || {})
    this.container.register(alias || name, asValue({ name, version, plugin, options }))
  }

  /**
   * Get a plugin instance.
   * @param  {string} key
   * @return {Object}
   * @throws {Error}
   */
  get (key) {
    try {
      return this.container.resolve(key).plugin
    } catch (err) {
      throw new Error(err.message)
    }
  }

  /**
   * Determine if the given plugin exists.
   * @param  {String}  key
   * @return {Boolean}
   */
  has (key) {
    try {
      this.container.resolve(key)

      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Get the configuration of a plugin.
   * @param  {String} key
   * @return {Object}
   * @throws {Error}
   */
  config (key) {
    try {
      return this.container.resolve(key).options
    } catch (err) {
      throw new Error(`The service "${key}" is not available.`)
    }
  }

  /**
   * Resolve a plugin instance.
   * @param  {(String|Object)} plugin
   * @return {Object}
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
   * Determine if the given plugin should be registered.
   * @param  {String} name
   * @return {Boolean}
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

  /**
   * Export path variables before we bootstrap any plugins.
   * @param  {Object} paths
   * @return {void}
   */
  __exportPaths (paths) {
    process.env.ARK_PATH_DATA = expandHomeDir(paths.data)
    process.env.ARK_PATH_CONFIG = expandHomeDir(paths.config)
  }
}

/**
 * @type {PluginManager}
 */
module.exports = new PluginManager()
