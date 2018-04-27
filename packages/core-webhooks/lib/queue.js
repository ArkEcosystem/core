'use strict';

const Bull = require('bull')

let instance

module.exports = class Queue {
  /**
   * Create a new queue instance.
   * @param  {Object} config
   * @return {Queue}
   */
  constructor (config) {
    this.config = config

    if (!instance) {
      instance = this
    }

    return instance
  }

  /**
   * Get a queue instance.
   * @return {Queue}
   */
  static getInstance () {
    return instance
  }

  /**
   * Get a queue connection instance.
   * @param  {string} connection
   * @return {Bull}
   */
  connection (connection) {
    return new Bull(connection, { redis: this.config })
  }
}
