const path = require('path')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const Hoek = require('hoek')

class PluginLoader {
  init (config) {
    if (isString(config)) {
      config = require(path.resolve(expandHomeDir(`${config}/plugins.json`)))
    }

    this.config = config
    this.state = {}

    this.plugins = {}
    this.bindings = {}
  }

  async hook (name) {
    for (const [pluginName, pluginConfig] of Object.entries(this.config[name])) {
      await this.register(pluginName, pluginConfig, name)
    }
  }

  async register (name, config, hook = 'default') {
    if (!name.startsWith('@')) {
      name = path.resolve(name)
    }

    const plugin = require(name).plugin

    if (!plugin.hasOwnProperty('register')) {
      return false
    }

    if (plugin.hasOwnProperty('defaults')) {
      config = Hoek.applyToDefaults(plugin.defaults, config)
    }

    const instance = await plugin.register(hook, config, this.state)

    this.plugins[plugin.pkg.name] = {
      plugin: instance,
      config
    }

    if (plugin.hasOwnProperty('alias')) {
      this.plugins[plugin.alias] = this.plugins[plugin.pkg.name]
      delete this.plugins[plugin.pkg.name]
    }

    if (plugin.hasOwnProperty('bindings')) {
      for (const [bindingName, bindingValue] of Object.entries(plugin.bindings)) {
        this.bindings[bindingName] = bindingValue
      }
    }
  }

  get (key) {
    return this.plugins[key].plugin
  }

  has (key) {
    return this.plugins.hasOwnProperty(key)
  }

  config (key) {
    return this.plugins[key].config
  }

  hasConfig (key) {
    return this.plugins[key].hasOwnProperty('config')
  }

  binding (key) {
    return this.bindings[key]
  }

  hasBinding (key) {
    return this.bindings.hasOwnProperty(key)
  }

  setState (values, merge = true) {
    this.state = merge ? Object.assign(values, this.state) : values
  }
}

module.exports = new PluginLoader()
