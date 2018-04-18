'use strict';

const pino = require('pino')

class Logger {
  /**
   * [init description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  init (config) {
    const pretty = pino.pretty()
    pretty.pipe(process.stdout)

    this.pino = pino({
      name: 'ark-core',
      safe: true
    }, pretty)

    return this
  }

  /**
   * [error description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  error (message) {
    return this.pino.error(message)
  }

  /**
   * [warning description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  warning (message) {
    return this.pino.warn(message)
  }

  /**
   * [info description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  info (message) {
    return this.pino.info(message)
  }

  /**
   * [debug description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  debug (message) {
    return this.pino.debug(message)
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

/**
 * [exports description]
 * @type {Logger}
 */
module.exports = new Logger()
