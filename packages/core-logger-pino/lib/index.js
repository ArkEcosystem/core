'use strict';

const pino = require('./logger')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (manager, options) => {
    const instance = await pino.init(options)

    await manager.get('logger').setDriver(instance)
  }
}
