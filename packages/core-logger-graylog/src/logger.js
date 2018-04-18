'use strict';

const graylog2 = require('graylog2')

class Logger {
  /**
   * [init description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  init (config) {
    this.graylog = new graylog2.graylog(config) // eslint-disable-line new-cap
  }

  /**
   * [error description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  error (message) {
    return this.graylog.error(message)
  }

  /**
   * [warning description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  warning (message) {
    return this.graylog.warning(message)
  }

  /**
   * [info description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  info (message) {
    return this.graylog.info(message)
  }

  /**
   * [debug description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  debug (message) {
    return this.graylog.debug(message)
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
