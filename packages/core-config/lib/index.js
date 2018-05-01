'use strict'

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
 * The interface used by concrete implementations.
 * @type {ConfigInterface}
 */
exports.ConfigInterface = require('./interface')

/**
 * Get the target directory for the given name.
 * @param  {String} name
 * @return {String}
 */
exports.getTargetDirectory = (name) => require('expand-home-dir')(`~/.ark/${name}`)
