'use strict';
/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'graphql',
  async register (manager, options) {
    return require('./schema')
  }
}
