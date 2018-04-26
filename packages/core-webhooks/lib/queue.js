'use strict';

const Bull = require('bull')

let instance

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class Queue {
  /**
   * [constructor description]
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
   * [getInstance description]
   * @return {Queue}
   */
  static getInstance () {
    return instance
  }

  /**
   * [connection description]
   * @param  {string} connection
   * @return {Bull}
   */
  connection (connection) {
    return new Bull(connection, { redis: this.config })
  }
}
