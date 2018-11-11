class LogManager {
  /**
   * Create a new log manager instance.
   * @constructor
   */
  constructor() {
    this.drivers = {}
  }

  /**
   * Get a logger instance.
   * @param  {String} name
   * @return {LoggerInterface}
   */
  driver(name = 'default') {
    return this.drivers[name]
  }

  /**
   * Make the logger instance.
   * @param  {LoggerInterface} driver
   * @param  {String} name
   * @return {void}
   */
  async makeDriver(driver, name = 'default') {
    this.drivers[name] = await driver.make()
  }
}

module.exports = new LogManager()
