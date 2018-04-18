'use strict';

const SequelizeConnection = require('./connection')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (manager, options) => {
    manager.get('logger').info('Establishing Database Connection...')

    const databaseManager = manager.get('blockchain').getDatabaseManager()

    const sequelize = new SequelizeConnection(options)

    await databaseManager.makeConnection(sequelize)
  }
}
