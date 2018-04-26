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

exports.LoggerInterface = require('./interface')
