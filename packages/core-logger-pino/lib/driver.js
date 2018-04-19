'use strict';

const pino = require('pino')
const { LoggerInterface } = require('@arkecosystem/core-logger')

module.exports = class Logger extends LoggerInterface {
  /**
   * [make description]
   * @param  {[type]} options [description]
   * @return {[type]}        [description]
   */
  make (options) {
    const pretty = pino.pretty()
    pretty.pipe(process.stdout)

    this.driver = pino(options, pretty)

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
    return this.driver.warn(message)
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
  printTracker (title, current, max, posttitle, figures = 0) {}

  /**
   * [stopTracker description]
   * @param  {[type]} title   [description]
   * @param  {[type]} current [description]
   * @param  {[type]} max     [description]
   * @return {[type]}         [description]
   */
  stopTracker (title, current, max) {}
}
