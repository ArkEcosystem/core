const path = require('path')
const fs = require('fs')
const semver = require('semver')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const Hoek = require('hoek')
const { asValue } = require('awilix')

module.exports = class PluginRegistrars {
  /**
   * Create a new plugin manager instance.
   * @param  {Container} container
   * @param  {Object} options
   */
  constructor (container, options = {}) {
    const plugins = path.resolve(expandHomeDir(`${process.env.ARK_PATH_CONFIG}/plugins.js`))

    if (!fs.existsSync(plugins)) {
      throw new Error('An invalid configuration was provided or is inaccessible due to it\'s security settings.')
      process.exit(1) // eslint-disable-line no-unreachable
    }

    this.container = container
    this.groups = require(plugins)
    this.options = options
    this.deregister = []
    this.plugins = {}

    Object.keys(this.groups).forEach((key) => {
      typeof this.groups[key] === 'object'
        ? Object.assign(this.plugins, this.groups[key])
        : this.plugins[key] = this.groups[key]
    })
  }

  /**
   * Deregister all plugins.
   * @return {void}
   */
  async tearDown () {
    const plugins = this.deregister.reverse()

    for (let i = 0; i < plugins.length; i++) {
      await plugins[i].deregister(this.container)
    }
  }

  /**
   * Register a plugin.
   * @param  {String} name
   * @param  {Object} options
   * @return {void}
   */
  async register (name, options = {}) {
    return this.__registerWithContainer(name, Hoek.applyToDefaults(this.plugins[name], options))
  }

  /**
   * Register a group of plugins.
   * @param  {String} name
   * @param  {Object} options
   * @return {void}
   */
  async registerGroup (name, options = {}) {
    for (let [pluginName, pluginOptions] of Object.entries(this.groups[name])) {
      if (this.__shouldBeRegistered(pluginName)) {
        await this.__registerWithContainer(pluginName, Hoek.applyToDefaults(pluginOptions, options))
      }
    }
  }

  /**
   * Register a plugin.
   * @param  {Object} plugin
   * @param  {Object} options
   * @return {void}
   */
  async __registerWithContainer (plugin, options = {}) {
    let item = this.__resolve(plugin)

    if (!item.plugin.register) {
      return
    }

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

    plugin = await item.plugin.register(this.container, options || {})
    this.container.register(alias || name, asValue({ name, version, plugin, options }))

    if (item.plugin.hasOwnProperty('deregister')) {
      this.deregister.push(item.plugin)
    }
  }

  /**
   * Resolve a plugin instance.
   * @param  {(String|Object)} plugin
   * @return {Object}
   */
  __resolve (plugin) {
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
}
