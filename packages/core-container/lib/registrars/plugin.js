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
    this.container = container
    this.plugins = this.__loadPlugins()
    this.resolvedPlugins = []
    this.options = options
    this.deregister = []
  }

  /**
   * Set up all available plugins.
   * @return {void}
   */
  resolveOptions (name) {
    if (!this.resolvedPlugins.length) {
      this.resolvedPlugins = Object
        .keys(this.plugins)
        .map(plugin => require(plugin).plugin)
    }

    const plugin = Object.values(this.resolvedPlugins).find(plugin => {
      return plugin.alias === name || plugin.pkg.name === name
    })

    return this.__applyToDefaults(plugin.pkg.name, plugin.defaults, this.plugins[plugin.pkg.name])
  }

  /**
   * Set up all available plugins.
   * @return {void}
   */
  async setUp () {
    for (const [name, options] of Object.entries(this.plugins)) {
      await this.register(name, options)

      if ((this.options.exit && this.options.exit === name) || this.container.shuttingDown) {
        break
      }
    }
  }

  /**
   * Deregister all plugins.
   * @return {void}
   */
  async tearDown () {
    const plugins = this.deregister.reverse()

    for (let i = 0; i < plugins.length; i++) {
      await plugins[i].plugin.deregister(this.container, plugins[i].options)
    }
  }

  /**
   * Register a plugin.
   * @param  {String} name
   * @param  {Object} options
   * @return {void}
   */
  async register (name, options = {}) {
    if (!this.__shouldBeRegistered(name)) {
      return
    }

    if (this.plugins[name]) {
      options = Hoek.applyToDefaults(this.plugins[name], options)
    }

    return this.__registerWithContainer(name, options)
  }

  /**
   * Register a plugin.
   * @param  {Object} plugin
   * @param  {Object} options
   * @return {void}
   */
  async __registerWithContainer (plugin, options = {}) {
    const item = this.__resolve(plugin)

    if (!item.plugin.register) {
      return
    }

    if (item.plugin.extends) {
      await this.__registerWithContainer(item.plugin.extends)
    }

    const name = item.plugin.name || item.plugin.pkg.name
    const version = item.plugin.version || item.plugin.pkg.version
    const defaults = item.plugin.defaults || item.plugin.pkg.defaults
    const alias = item.plugin.alias || item.plugin.pkg.alias

    if (!semver.valid(version)) {
      throw new Error(`The plugin "${name}" provided an invalid version "${version}". Please check https://semver.org/ and make sure you follow the spec.`)
    }

    options = this.__applyToDefaults(name, defaults, options)

    plugin = await item.plugin.register(this.container, options || {})
    this.container.register(alias || name, asValue({ name, version, plugin, options }))

    if (item.plugin.hasOwnProperty('deregister')) {
      this.deregister.push({ plugin: item.plugin, options })
    }
  }

  /**
   * Apply the given options to the defaults of the given plugin.
   *
   * @param  {String} name
   * @param  {Object} defaults
   * @param  {Object} options
   * @return {Object}
   */
  __applyToDefaults (name, defaults, options) {
    if (defaults) {
      options = Hoek.applyToDefaults(defaults, options)
    }

    if (this.options.options && this.options.options.hasOwnProperty(name)) {
      options = Hoek.applyToDefaults(options, this.options.options[name])
    }

    return options
  }

  /**
   * Resolve a plugin instance.
   * @param  {(String|Object)} plugin - plugin name or path, or object
   * @return {Object}
   */
  __resolve (plugin) {
    let item = {}

    if (isString(plugin)) {
      if (plugin.startsWith('.')) {
        plugin = path.resolve(`${path.dirname(this.pluginsConfigPath)}/${plugin}`)
      } else if (!plugin.startsWith('@')) {
        plugin = path.resolve(plugin)
      }

      try {
        item = require(plugin)
      } catch (error) {
        console.log(error)
      }

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
   * Load plugins from any of the available files (plugins.js or plugins.json).
   * @return {[Object|void]}
   */
  __loadPlugins () {
    const files = ['plugins.js', 'plugins.json']

    for (const file of files) {
      const configPath = path.resolve(expandHomeDir(`${process.env.ARK_PATH_CONFIG}/${file}`))

      if (fs.existsSync(configPath)) {
        this.pluginsConfigPath = configPath

        return require(configPath)
      }
    }

    throw new Error('An invalid configuration was provided or is inaccessible due to it\'s security settings.')
    process.exit(1) // eslint-disable-line no-unreachable
  }
}
