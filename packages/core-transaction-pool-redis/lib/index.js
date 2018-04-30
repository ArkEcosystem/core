'use strict';

const RedisConnection = require('./connection')

/**
 * The struct used by the plugin manager.
 * @type {RedisDriver}
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

    // // Disable logging during tests
    // // NODE_ENV=test >>> Jest Test-Suite
    // if (process.env.NODE_ENV === 'test') {
    //   logManager.driver().clear()
    // }

    return transactionPoolManager.connection()
  }
}
