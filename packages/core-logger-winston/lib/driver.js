'use strict'

const winston = require('winston')
const { LoggerInterface } = require('@arkecosystem/core-logger')
require('colors')
let tracker = null

module.exports = class Logger extends LoggerInterface {
  /**
   * Make the logger instance.
   * @return {Winston.Logger}
   */
  make () {
    this.driver = winston.createLogger()

    this.__registerTransports()

    // this.__registerFilters()

    this.driver.printTracker = this.printTracker
    this.driver.stopTracker = this.stopTracker

    return this.driver
  }

  /**
   * Print the progress tracker.
   * @param  {String} title
   * @param  {Number} current
   * @param  {Number} max
   * @param  {String} postTitle
   * @param  {Number} figures
   * @return {void}
   */
  printTracker (title, current, max, postTitle, figures = 0) {
    const progress = 100 * current / max

    let line = '\u{1b}[0G  '
    line += title.blue
    line += ' ['
    line += ('='.repeat(progress / 2)).green
    line += ' '.repeat(50 - progress / 2) + '] '
    line += progress.toFixed(figures) + '% '

    if (postTitle) {
      line += postTitle + '                     '
    }

    process.stdout.write(line)

    tracker = line
  }

  /**
   * Stop the progress tracker.
   * @param  {String} title
   * @param  {Number} current
   * @param  {Number} max
   * @return {void}
   */
  stopTracker (title, current, max) {
    let progress = 100 * current / max

    if (progress > 100) {
      progress = 100
    }

    let line = '\u{1b}[0G  '
    line += title.blue
    line += ' ['
    line += ('='.repeat(progress / 2)).green
    line += ' '.repeat(50 - progress / 2) + '] '
    line += progress.toFixed(0) + '% '

    if (current === max) {
      line += '✔️'
    }

    line += '                                                     \n'
    process.stdout.write(line)
    tracker = null
  }

  /**
   * Register all transports.
   * @return {void}
   */
  __registerTransports () {
    for (const transport of Object.values(this.options.transports)) {
      if (transport.package) {
        require(transport.package)
      }

      this.driver.add(new winston.transports[transport.constructor](transport.options))
    }
  }

  /**
   * Register all filters.
   * @return {void}
   */
  __registerFilters () {
    this.driver.filters.push((level, message, meta) => {
      if (tracker) {
        process.stdout.write('\u{1b}[0G                                                                                                     \u{1b}[0G')
        tracker = null
      }

      return message
    })
  }
}
