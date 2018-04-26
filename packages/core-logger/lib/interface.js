'use strict';

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class LoggerInterface {
  /**
   * [constructor description]
   * @param  {Object} options
   */
  constructor (options) {
    this.options = options
  }

  /**
   * [driver description]
   * @return {LoggerInterface}
   */
  driver () {
    return this.driver
  }

  /**
   * [error description]
   * @param  {*} message
   * @return {void}
   */
  error (message) {
    throw new Error('Method [error] not implemented!')
  }

  /**
   * [warn description]
   * @param  {*} message
   * @return {void}
   */
  warn (message) {
    throw new Error('Method [warn] not implemented!')
  }

  /**
   * [info description]
   * @param  {*} message
   * @return {void}
   */
  info (message) {
    throw new Error('Method [info] not implemented!')
  }

  /**
   * [debug description]
   * @param  {*} message
   * @return {void}
   */
  debug (message) {
    throw new Error('Method [debug] not implemented!')
  }

  /**
   * [printTracker description]
   * @param  {String} title
   * @param  {Number} current
   * @param  {Number} max
   * @param  {String} posttitle
   * @param  {Number} figures
   * @return {void}
   */
  printTracker (title, current, max, posttitle, figures = 0) {
    throw new Error('Method [printTracker] not implemented!')
  }

  /**
   * [stopTracker description]
   * @param  {String} title
   * @param  {Number} current
   * @param  {Number} max
   * @return {void}
   */
  stopTracker (title, current, max) {
    throw new Error('Method [stopTracker] not implemented!')
  }
}
