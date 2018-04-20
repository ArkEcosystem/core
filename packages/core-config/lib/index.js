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

/**
 * [ConfigInterface description]
 * @type {[type]}
 */
exports.ConfigInterface = require('./interface')

/**
 * [description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
exports.getTargetDirectory = (name) => require('expand-home-dir')(`~/.ark/${name}`)
