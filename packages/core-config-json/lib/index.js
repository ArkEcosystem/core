'use strict'

const JsonDriver = require('./driver')
const { client } = require('@arkecosystem/client')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'config',
  register: async (manager, options) => {
    const configManager = manager.get('configManager')
    await configManager.makeDriver(new JsonDriver(options))

    client.setConfig(configManager.driver().network)

    return configManager.driver()
  }
}
