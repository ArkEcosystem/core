'use strict';
/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'graphql',
  register: async (manager, options) => require('./schema')
}
