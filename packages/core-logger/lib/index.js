'use strict'

const logManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'logManager',
  register: async (container, options) => logManager
}

/**
 * The interface used by concrete implementations.
 * @type {LoggerInterface}
 */
exports.LoggerInterface = require('./interface')
