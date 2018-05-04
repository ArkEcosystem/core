'use strict'

const configManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'configManager',
  register: async (container, options) => configManager
}

/**
 * The interface used by concrete implementations.
 * @type {ConfigInterface}
 */
exports.ConfigInterface = require('./interface')
