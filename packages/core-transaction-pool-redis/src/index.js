const logger = require('@arkecosystem/core-module-loader').get('logger')
const package = require('../package.json')
const TransactionHandler = require('./handler')

module.exports = {
  name: package.name,
  version: package.version,
  alias: 'transaction-pool',
  register: async(hook, config, app) => {
    logger.info('Initialising Transaction Pool...')

    const txHandler = await new TransactionHandler(app.config)

    await app.blockchainManager.attachTransactionHandler(txHandler)
  }
}
