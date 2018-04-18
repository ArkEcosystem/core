'use strict';

const pino = require('./logger')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  register: async (manager, hook, options) => {
    const instance = await pino.init(options)

    await manager.get('logger').setDriver(instance)
  }
}
