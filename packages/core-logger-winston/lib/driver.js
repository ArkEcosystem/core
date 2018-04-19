'use strict';

const expandHomeDir = require('expand-home-dir')
const winston = require('winston')
const { LoggerInterface } = require('@arkecosystem/core-logger')
const formatter = require('./formatter')
require('winston-daily-rotate-file')
require('colors')

module.exports = class Logger extends LoggerInterface {
  /**
   * [make description]
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  make (options) {
    this.driver = new (winston.Logger)()

    this.driver.add(winston.transports.DailyRotateFile, {
      filename: expandHomeDir(options.file) + '.%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: options.levels.file,
      zippedArchive: true,
      formatter: (info) => formatter(info)
    })

    this.driver.add(winston.transports.Console, {
      colorize: true,
      level: options.levels.console,
      timestamp: () => Date.now(),
      formatter: (info) => formatter(info)
    })

    this.driver.filters.push((level, message, meta) => {
      if (this.tracker) {
        process.stdout.write('\u{1b}[0G                                                                                                     \u{1b}[0G')
        this.tracker = null
      }

      return message
    })

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
}
