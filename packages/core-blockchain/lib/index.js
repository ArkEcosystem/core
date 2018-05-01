'use strict';

const BlockchainManager = require('./manager')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'blockchain',
  register: async (manager, options) => {
    await new BlockchainManager(manager.get('config'), options.networkStart)

    return BlockchainManager.getInstance()
  }
}
