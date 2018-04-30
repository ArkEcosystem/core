'use strict';

const transactionPoolManager = require('./manager')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'transactionPoolManager',
  register: async (manager, options) => transactionPoolManager
}

/**
 * The interface used by concrete implementations.
 * @type {TransactionPoolInterface}
 */
exports.TransactionPoolInterface = require('./interface')
