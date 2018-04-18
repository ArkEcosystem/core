'use strict';

const BlockchainManager = require('./manager')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'blockchain',
  register: async (manager, options) => {
    await new BlockchainManager(manager.get('config'))

    return BlockchainManager.getInstance()
  }
}
