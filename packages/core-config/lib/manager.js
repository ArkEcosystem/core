'use strict'

class ConfigManager {
  /**
   * Create a new config manager instance.
   * @constructor
   */
  constructor () {
    this.drivers = {}
  }

  /**
   * Get a config instance.
   * @param  {String} name
   * @return {ConfigInterface}
   */
  driver (name = 'default') {
    return this.drivers[name]
  }

  /**
   * Make the config instance.
   * @param  {ConfigInterface} driver
   * @param  {String} name
   * @return {void}
   */
  async makeDriver (driver, name = 'default') {
    this.drivers[name] = await driver.make()
  }
}

module.exports = new ConfigManager()
