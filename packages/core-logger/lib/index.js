'use strict';

const logManager = require('./manager')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'logManager',
  register: async (manager, options) => logManager
}

/**
 * The interface used by concrete implementations.
 * @type {LoggerInterface}
 */
exports.LoggerInterface = require('./interface')
