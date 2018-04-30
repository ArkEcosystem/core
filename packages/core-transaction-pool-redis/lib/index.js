'use strict';

const RedisDriver = require('./driver')

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
    await transactionPoolManager.makeDriver(new RedisDriver(options))

    // // Disable logging during tests
    // // NODE_ENV=test >>> Jest Test-Suite
    // if (process.env.NODE_ENV === 'test') {
    //   logManager.driver().clear()
    // }

    return transactionPoolManager.driver()
  }
}
