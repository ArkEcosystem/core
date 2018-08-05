'use strict'

const SequalizeConnection = require('./connection')
const database = require('./database')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'transactionPool',
  async register (container, options) {
    container.resolvePlugin('logger').info('Connecting to transaction pool')

    await database.setUp(options.database)

    const transactionPoolManager = container.resolvePlugin('transactionPoolManager')
    await transactionPoolManager.makeConnection(new SequalizeConnection(options))

    return transactionPoolManager.connection()
  },
  async deregister (container, options) {
    container.resolvePlugin('logger').info('Disconnecting from transaction pool')

    return container.resolvePlugin('transactionPool').disconnect()
  }
}
