'use strict';

const winston = require('winston')
const { LoggerInterface } = require('@arkecosystem/core-logger')
require('colors')

module.exports = class Logger extends LoggerInterface {
  /**
   * [make description]
   * @return {[type]} [description]
   */
  make () {
    this.driver = new (winston.Logger)()

    this.__registerTransports()

    this.__registerFilters()

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
  printTracker (title, current, max, posttitle, figures = 0) {
    const progress = 100 * current / max
    let line = '\u{1b}[0G  '
    line += title.blue
    line += ' ['
    line += ('='.repeat(progress / 2)).green
    line += ' '.repeat(50 - progress / 2) + '] '
    line += progress.toFixed(figures) + '% '
    if (posttitle) line += posttitle + '                     '
    process.stdout.write(line)
    this.tracker = line
  }

  /**
   * [stopTracker description]
   * @param  {[type]} title   [description]
   * @param  {[type]} current [description]
   * @param  {[type]} max     [description]
   * @return {[type]}         [description]
   */
  stopTracker (title, current, max) {
    const progress = 100 * current / max
    let line = '\u{1b}[0G  '
    line += title.blue
    line += ' ['
    line += ('='.repeat(progress / 2)).green
    line += ' '.repeat(50 - progress / 2) + '] '
    line += progress.toFixed(0) + '% '
    if (current === max) line += '✔️'
    line += '                              \n'
    process.stdout.write(line)
    this.tracker = null
  }

  /**
   * [__registerTransports description]
   * @return {[type]} [description]
   */
  __registerTransports () {
    Object.values(this.options.transports).forEach(transport => {
      if (transport.package) {
        require(transport.package)
      }

      this.driver.add(winston.transports[transport.constructor], transport.options)
    })
  }

  /**
   * [__registerFilters description]
   * @return {[type]} [description]
   */
  __registerFilters () {
    this.driver.filters.push((level, message, meta) => {
      if (this.tracker) {
        process.stdout.write('\u{1b}[0G                                                                                                     \u{1b}[0G')
        this.tracker = null
      }

      return message
    })
  }
}
