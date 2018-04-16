const logger = require('@arkecosystem/core-module-loader').get('logger')
const TransactionHandler = require('./handler')

exports.plugin = {
  pkg: require('../package.json'),
  alias: 'transaction-pool',
  register: async(hook, config, app) => {
    logger.info('Initialising Transaction Pool...')

    const txHandler = await new TransactionHandler(app.config)

    await app.blockchainManager.attachTransactionHandler(txHandler)
  }
}
