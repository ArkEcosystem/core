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
  register: async (hook, config, app) => {
    const database = await DatabaseInterface.init()

    await app.blockchainManager.attachDatabaseInterface(database)

    return app.blockchainManager.getDb()
  }
}

/**
 * [DatabaseInterface description]
 * @type {[type]}
 */
exports.DatabaseInterface = DatabaseInterface
