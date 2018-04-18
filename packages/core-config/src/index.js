'use strict';

const configManager = require('./manager')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'config',
  register: async (manager, hook, options) => configManager.init(options.network)
}
