'use strict';

const configManager = require('./manager')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'configManager',
  register: async (manager, options) => configManager
}

exports.ConfigInterface = require('./interface')
