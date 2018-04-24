'use strict';

const JsonDriver = require('./driver')
const { client, NetworkManager } = require('@arkecosystem/client')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'config',
  register: async (manager, options) => {
    const configManager = manager.get('configManager')
    await configManager.makeDriver(new JsonDriver(options))

    client.setConfig(NetworkManager.findByName(configManager.driver().network.name))

    return configManager.driver()
  }
}
