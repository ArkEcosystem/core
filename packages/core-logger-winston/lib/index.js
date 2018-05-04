'use strict'

const WinstonDriver = require('./driver')

/**
 * The struct used by the plugin container.
 * @type {WinstonDriver}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'logger',
  register: async (container, options) => {
    const logManager = container.get('logManager')
    await logManager.makeDriver(new WinstonDriver(options))

    // // Disable logging during tests
    // // NODE_ENV=test >>> Jest Test-Suite
    // if (process.env.NODE_ENV === 'test') {
    //   logManager.driver().clear()
    // }

    return logManager.driver()
  }
}

/**
 * Expose the winston formatter for configuration.
 * @type {Function}
 */
exports.formatter = require('./formatter')
