'use strict'

const Storage = require('./storage')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'storage',
  async register (container, options) {
    return new Storage()
  }
}
