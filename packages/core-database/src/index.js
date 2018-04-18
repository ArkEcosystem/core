'use strict';

const databaseManager = require('./manager')

/**
 * This plugin is only an interface and will be overwritten by a concrete implementation.
 *
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  alias: 'database',
  register: async (manager, options) => {
    manager.get('logger').info('Starting Database Manager...')

    const blockchainManager = manager.get('blockchain')

    await blockchainManager.setDatabaseManager(databaseManager)

    return blockchainManager.getDatabaseManager()
  }
}

/**
 * [Connection description]
 * @type {[type]}
 */
exports.Connection = require('./connection')
