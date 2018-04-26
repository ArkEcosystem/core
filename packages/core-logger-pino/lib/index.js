'use strict';

const PinoDriver = require('./driver')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'logger',
  register: async (manager, options) => {
    const logManager = manager.get('logManager')
    await logManager.makeDriver(new PinoDriver(options))

    return logManager.driver()
  }
}
