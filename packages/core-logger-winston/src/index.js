'use strict';

const winston = require('./logger')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (manager, hook, options) => {
    const instance = await winston.init(options)

    await manager.get('logger').setDriver(instance)
  }
}
