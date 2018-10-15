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
  extends: '@arkecosystem/core-logger',
  async register (container, options) {
    const logManager = container.resolvePlugin('logManager')
    await logManager.makeDriver(new WinstonDriver(options))

    return logManager.driver()
  }
}

/**
 * Expose the winston formatter for configuration.
 * @type {Function}
 */
exports.formatter = require('./formatter')
