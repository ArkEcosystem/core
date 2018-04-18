'use strict';

class Logger {
  /**
   * [init description]
   * @return {[type]} [description]
   */
  init () {
    return this
  }

  /**
   * [getDriver description]
   * @return {[type]} [description]
   */
  getDriver () {
    return this.driver
  }

  /**
   * [setDriver description]
   * @param {[type]} instance [description]
   */
  async setDriver (instance) {
    this.driver = instance

    return this
  }

  /**
   * [error description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  error (message) {
    return this.driver.error(message)
  }

  /**
   * [warning description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  warning (message) {
    return this.driver.warning(message)
  }

  /**
   * [info description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  info (message) {
    return this.driver.info(message)
  }

  /**
   * [debug description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  debug (message) {
    return this.driver.debug(message)
  }

  /**
   * [printTracker description]
   * @param  {[type]} title     [description]
   * @param  {[type]} current   [description]
   * @param  {[type]} max       [description]
   * @param  {[type]} posttitle [description]
   * @param  {Number} figures   [description]
   * @return {[type]}           [description]
   */
  printTracker (title, current, max, posttitle, figures = 0) {
    this.driver.printTracker(title, current, max, posttitle, figures)
  }

  /**
   * [stopTracker description]
   * @param  {[type]} title   [description]
   * @param  {[type]} current [description]
   * @param  {[type]} max     [description]
   * @return {[type]}         [description]
   */
  stopTracker (title, current, max) {
    this.driver.stopTracker(title, current, max)
  }
}

/**
 * [exports description]
 * @type {Logger}
 */
module.exports = new Logger()
