'use strict'

const RedisConnection = require('./connection')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'transactionPool',
  register: async (manager, options) => {
    manager.get('logger').info('Establishing Transaction Pool Connection...')

    const transactionPoolManager = manager.get('transactionPoolManager')
    await transactionPoolManager.makeConnection(new RedisConnection(options))

    return transactionPoolManager.connection()
  }
}
