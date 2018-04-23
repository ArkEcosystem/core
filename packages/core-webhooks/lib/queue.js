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
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
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
   * @return {[type]} [description]
   */
  static getInstance () {
    return instance
  }

  /**
   * [connection description]
   * @param  {[type]} connection [description]
   * @return {[type]}            [description]
   */
  connection (connection) {
    return new Bull(connection, { redis: this.config })
  }
}
