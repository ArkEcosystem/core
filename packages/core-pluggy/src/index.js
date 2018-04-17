const path = require('path')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const assert = require('assert-plus')

class PluginLoader {
  init(plugins) {
    if (isString(plugins)) {
      plugins = require(path.resolve(expandHomeDir(`${plugins}/plugins.json`)))
    }

    this.plugins = plugins
    this.state = {}

    this.registrations = {}
  }

  async hook(name) {
    for (const [pluginName, pluginConfig] of Object.entries(this.plugins[name])) {
      await this.register(pluginName, pluginConfig, name)
    }
  }

  async register(name, config, hook = 'default') {
    if (!name.startsWith('@')) {
      name = path.resolve(name)
    }

    const plugin = require(name).plugin

    if (!plugin.hasOwnProperty('register')) {
      return false
    }

    const instance = await plugin.register(hook, config, this.state)

    this.registrations[plugin.pkg.name] = {
      plugin: instance,
      config
    }

    if (plugin.alias) {
      this.registrations[plugin.alias] = this.registrations[plugin.pkg.name]
      delete this.registrations[plugin.pkg.name]
    }
  }

  get(key) {
    return this.registrations[key].plugin
  }

  has(key) {
    return !!this.registrations[key].plugin
  }

  config(key) {
    return this.registrations[key].config
  }

  hasConfig(key) {
    return !!this.registrations[key].config
  }

  setState(values, merge = true) {
    this.state = merge ? Object.assign(values, this.state) : values
  }
}

module.exports = new PluginLoader()
