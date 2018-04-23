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
    this.driver.printTracker = this.printTracker
    this.driver.stopTracker = this.stopTracker

    return this.driver
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
