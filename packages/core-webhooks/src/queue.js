'use strict';

const Bull = require('bull')

let instance

module.exports = class Queue {
  constructor (config) {
    this.config = config

    if (!instance) {
      instance = this
    }

    return instance
  }

  static getInstance () {
    return instance
  }

  connection (connection) {
    return new Bull(connection, { redis: this.config })
  }
}
