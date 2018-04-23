'use strict';

class ConfigManager {
  constructor () {
    this.drivers = {}
  }

  driver (name = 'default') {
    return this.drivers[name]
  }

  async makeDriver (driver, name = 'default') {
    this.drivers[name] = await driver.make()
  }
}

module.exports = new ConfigManager()
