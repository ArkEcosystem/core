'use strict'

const PinoDriver = require('./driver')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'logger',
  register: async (container, options) => {
    const logManager = container.get('logManager')
    await logManager.makeDriver(new PinoDriver(options))

    return logManager.driver()
  }
}
