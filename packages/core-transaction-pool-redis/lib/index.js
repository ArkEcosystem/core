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
    container.get('logger').info('Establishing Transaction Pool Connection...')

    const transactionPoolManager = container.get('transactionPoolManager')
    await transactionPoolManager.makeConnection(new RedisConnection(options))

    return transactionPoolManager.connection()
  },
  deregister: async (container) => {
    container.get('logger').info('Closing Transaction Pool Connection...')

    return container.get('transactionPool').disconnect()
  }
}
