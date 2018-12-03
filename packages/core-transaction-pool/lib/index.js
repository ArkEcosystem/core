const transactionPoolManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'transactionPoolManager',
  async register(container, options) {
    return transactionPoolManager
  },
}

/**
 * The interface used by concrete implementations.
 * @type {TransactionPoolInterface}
 */
exports.TransactionPoolInterface = require('./interface')

/**
 * The guard used to handle transaction validation.
 * @type {TransactionGuard}
 */
exports.TransactionGuard = require('./guard')
