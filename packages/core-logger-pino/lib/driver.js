'use strict'

const pino = require('pino')
const { LoggerInterface } = require('@arkecosystem/core-logger')

module.exports = class Logger extends LoggerInterface {
  /**
   * Make the logger instance.
   * @param  {Object} options
   * @return {Pino}
   */
  make (options) {
    const pretty = pino.pretty()
    pretty.pipe(process.stdout)

    this.driver = pino(options, pretty)
    this.driver.printTracker = this.printTracker
    this.driver.stopTracker = this.stopTracker

    return this.driver
  }

  /**
   * Print the progress tracker.
   * @param  {String} title
   * @param  {Number} current
   * @param  {Number} max
   * @param  {String} posttitle
   * @param  {Number} figures
   * @return {void}
   */
  printTracker (title, current, max, posttitle, figures = 0) {}

  /**
   * Stop the progress tracker.
   * @param  {String} title
   * @param  {Number} current
   * @param  {Number} max
   * @return {void}
   */
  stopTracker (title, current, max) {}
}
