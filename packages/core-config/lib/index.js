'use strict';

const configManager = require('./manager')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'configManager',
  register: async (manager, options) => configManager
}

/**
 * [ConfigInterface description]
 * @type {ConfigInterface}
 */
exports.ConfigInterface = require('./interface')

/**
 * [description]
 * @param  {String} name
 * @return {String}
 */
exports.getTargetDirectory = (name) => require('expand-home-dir')(`~/.ark/${name}`)
