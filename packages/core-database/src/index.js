'use strict';

const DatabaseInterface = require('./interface')

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
    const database = await DatabaseInterface.init()

    const blockchainManager = manager.get('blockchain')
    await blockchainManager.attachDatabaseInterface(database)

    return blockchainManager.getDb()
  }
}

/**
 * [DatabaseInterface description]
 * @type {[type]}
 */
exports.DatabaseInterface = DatabaseInterface
