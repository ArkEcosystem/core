'use strict';

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
 * [Connection description]
 * @type {ConnectionInterface}
 */
exports.Connection = require('./connection')
