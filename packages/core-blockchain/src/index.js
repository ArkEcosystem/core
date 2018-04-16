const logger = require('@arkecosystem/core-module-loader').get('logger')
const package = require('../package.json')
const BlockchainManager = require('./manager')

module.exports = {
  name: package.name,
  version: package.version,
  alias: 'blockchain',
  register: async(hook, config, app) => new BlockchainManager(app.config)
}
