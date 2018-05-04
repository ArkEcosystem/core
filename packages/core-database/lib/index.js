'use strict'

const databaseManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'databaseManager',
  register: async (container, options) => {
    container.get('logger').info('Starting Database Manager...')

    return databaseManager
  }
}

/**
 * The interface used by concrete implementations.
 * @type {ConnectionInterface}
 */
exports.ConnectionInterface = require('./interface')
