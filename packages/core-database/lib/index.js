'use strict';

const databaseManager = require('./manager')

/**
 * [plugin description]
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
 * @type {[type]}
 */
exports.Connection = require('./connection')
