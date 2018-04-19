'use strict';

const logManager = require('./manager')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  alias: 'logManager',
  register: async (manager, options) => logManager
}

exports.LoggerInterface = require('./interface')
