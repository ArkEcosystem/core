'use strict';

const WinstonDriver = require('./driver')

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
    await logManager.makeDriver(new WinstonDriver(options))

    // // Disable logging during tests
    // // NODE_ENV=test >>> Jest Test-Suite
    // if (process.env.NODE_ENV === 'test') {
    //   logManager.driver().clear()
    // }

    return logManager.driver()
  }
}
