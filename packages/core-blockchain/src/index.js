const logger = require('@arkecosystem/core-module-loader').get('logger')
const BlockchainManager = require('./manager')

exports.plugin = {
  pkg: require('../package.json'),
  alias: 'blockchain',
  register: async(hook, config, app) => {
    await new BlockchainManager(app.config)

    return BlockchainManager.getInstance()
  }
}
