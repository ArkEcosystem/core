'use strict'

const SequelizeConnection = require('./connection')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'database',
  register: async (manager, options) => {
    manager.get('logger').info('Establishing Database Connection...')

    const sequelize = new SequelizeConnection(options)

    const databaseManager = manager.get('databaseManager')
    await databaseManager.makeConnection(sequelize)

    return databaseManager.connection()
  }
}
