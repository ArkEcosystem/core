'use strict'

const RedisConnection = require('./connection')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'transactionPool',
  register: async (container, options) => {
    container.resolvePlugin('logger').info('Connecting to transaction pool...')

    const transactionPoolManager = container.resolvePlugin('transactionPoolManager')
    await transactionPoolManager.makeConnection(new RedisConnection(options))

    return transactionPoolManager.connection()
  },
  deregister: async (container) => {
    container.resolvePlugin('logger').info('Disconnecting from transaction pool...')

    return container.resolvePlugin('transactionPool').disconnect()
  }
}
