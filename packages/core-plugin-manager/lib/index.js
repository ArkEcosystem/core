'use strict';

const path = require('path')
const fs = require('fs')
const semver = require('semver')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const Hoek = require('hoek')
const { createContainer, asValue } = require('awilix')

class PluginManager {
  /**
   * [constructor description]
   */
  constructor () {
    this.container = createContainer()
  }

  /**
   * [init description]
   * @param  {Object} config
   * @param  {Object} options
   * @return {void}
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
   * [register description]
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

    if (defaults) options = Hoek.applyToDefaults(defaults, options)

    plugin = await item.plugin.register(this, options || {})
    this.container.register(alias || name, asValue({ name, version, plugin, options }))
  }

  /**
   * [get description]
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
   * [has description]
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
   * [config description]
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
   * [__resolvePlugin description]
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
   * [__shouldBeRegistered description]
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
}

/**
 * [exports description]
 * @type {PluginManager}
 */
module.exports = new PluginManager()
