const path = require('path')
const isString = require('lodash/isString')
const expandHomeDir = require('expand-home-dir')
const assert = require('assert-plus')

class ModuleLoader {
  boot(plugins) {
    if (isString(plugins)) {
      plugins = require(path.resolve(expandHomeDir(`${plugins}/plugins.json`)))
    }

    this.plugins = plugins
    this.instances = {}
    this.state = {}
  }

  async register(hook) {
    for (const [moduleName, moduleConfig] of Object.entries(this.plugins[hook])) {
      const module = require(moduleName).plugin

      if (!module.hasOwnProperty('register')) continue

      this.instances[module.alias || module.name] = await module.register(hook, moduleConfig, this.state)

      if (module.alias) {
        this.instances[module.name]
      }
    }
  }

  get(name) {
    return this.instances[name]
  }

  setState(values, merge = true) {
    this.state = merge ? Object.assign(values, this.state) : values
  }
}

module.exports = new ModuleLoader()
