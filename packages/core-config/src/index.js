'use strict';

const manager = require('./manager')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'config',
  register: async (hook, config, app) => manager.init(app.network)
}
