'use strict';

const JsonDriver = require('./driver')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'config',
  register: async (manager, options) => {
    const configManager = manager.get('configManager')
    await configManager.makeDriver(new JsonDriver(options.config || options))

    return configManager.driver()
  }
}
