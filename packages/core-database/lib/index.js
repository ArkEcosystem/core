'use strict'

const databaseManager = require('./manager')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'databaseManager',
  register: async (manager, options) => {
    manager.get('logger').info('Starting Database Manager...')

    return databaseManager
  }
}

/**
 * The interface used by concrete implementations.
 * @type {ConnectionInterface}
 */
exports.ConnectionInterface = require('./interface')
