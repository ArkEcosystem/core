'use strict';

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
    const transactionPoolManager = manager.get('transactionPoolManager')
    manager.get('logger').info('Establishing Transaction Pool Redis Connection...')
    const redis = new RedisConnection(options)

    await transactionPoolManager.makeConnection(redis)
    return transactionPoolManager.connection()
  }
}
