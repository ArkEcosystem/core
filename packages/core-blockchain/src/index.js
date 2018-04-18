'use strict';

const BlockchainManager = require('./manager')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'blockchain',
  register: async (hook, config, app) => {
    await new BlockchainManager(app.config)

    return BlockchainManager.getInstance()
  }
}
