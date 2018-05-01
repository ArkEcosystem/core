'use strict'

class TransactionPoolManager {
  /**
   * Create a new transaction pool manager instance.
   * @constructor
   */
  constructor () {
    this.drivers = {}
  }

  /**
   * Get a transaction pool instance.
   * @param  {String} name
   * @return {TransactionPoolInterface}
   */
  connection (name = 'default') {
    return this.drivers[name]
  }

  /**
   * Make the logger instance.
   * @param  {TransactionPoolInterface} driver
   * @param  {String} name
   * @return {void}
   */
  async makeConnection (driver, name = 'default') {
    this.drivers[name] = await driver.make()
  }
}

module.exports = new TransactionPoolManager()
