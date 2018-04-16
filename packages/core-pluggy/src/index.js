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
  }

  async bind(hook, app = {}) {
    for (const [moduleName, moduleConfig] of Object.entries(this.plugins[hook])) {
      const module = require(moduleName).plugin

      if (!module.hasOwnProperty('register')) continue

      this.instances[module.alias || module.name] = await module.register(hook, moduleConfig, app)

      if (module.alias) {
        this.instances[module.name]
      }
    }
  }

  get(name) {
    return this.instances[name]
  }
}

module.exports = new ModuleLoader()
