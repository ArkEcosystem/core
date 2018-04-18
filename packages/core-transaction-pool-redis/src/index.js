'use strict';

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const TransactionHandler = require('./handler')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  alias: 'transaction-pool',
  register: async (hook, config, app) => {
    logger.info('Starting Transaction Pool...')

    const handler = await new TransactionHandler(config)

    await app.blockchainManager.attachTransactionHandler(handler)
  }
}
