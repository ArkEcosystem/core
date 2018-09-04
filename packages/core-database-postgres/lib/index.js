'use strict'

const PostgresConnection = require('./connection')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'database',
  async register (container, options) {
    container.resolvePlugin('logger').info('Establishing Database Connection')

    const sequelize = new PostgresConnection(options)

    const databaseManager = container.resolvePlugin('databaseManager')
    await databaseManager.makeConnection(sequelize)

    return databaseManager.connection()
  },
  async deregister (container, options) {
    container.resolvePlugin('logger').info('Closing Database Connection')

    return container.resolvePlugin('database').disconnect()
  }
}
