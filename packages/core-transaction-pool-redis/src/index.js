'use strict';

const TransactionHandler = require('./handler')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  alias: 'transaction-pool',
  register: async (manager, options) => {
    manager.get('logger').info('Starting Transaction Pool...')

    const handler = await new TransactionHandler(options)

    await manager.get('blockchain').setTransactionHandler(handler)
  }
}
