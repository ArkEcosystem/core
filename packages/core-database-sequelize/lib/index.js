'use strict'

const SequelizeConnection = require('./connection')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'database',
  register: async (container, options) => {
    container.get('logger').info('Establishing Database Connection...')

    const sequelize = new SequelizeConnection(options)

    const databaseManager = container.get('databaseManager')
    await databaseManager.makeConnection(sequelize)

    return databaseManager.connection()
  },
  deregister: async (container) => {
    container.get('logger').info('Closing Database Connection...')

    return container.get('database').disconnect()
  }
}
