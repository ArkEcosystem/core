'use strict';

const path = require('path')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const Hoek = require('hoek')

class PluginManager {
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
    for (const [pluginName, pluginOptions] of Object.entries(this.config[name])) {
      await this.register(pluginName, pluginOptions, name)
    }
  }

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
    const instance = await item.plugin.register(hook, options || {}, this.state)

    this.plugins[name] = { name, version, plugin: instance, options }

    if (alias) {
      this.plugins[alias] = this.plugins[name]
    }

    if (item.plugin.bindings) {
      for (const [bindingName, bindingValue] of Object.entries(item.plugin.bindings)) {
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
    return this.plugins[key].options
  }

  hasOptions (key) {
    return this.plugins[key].hasOwnProperty('options')
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

module.exports = new PluginManager()
