const package = require('../package.json')
const DatabaseInterface = require('./interface')
const logger = require('@arkecosystem/core-module-loader').get('logger')

module.exports = {
  name: package.name,
  version: package.version,
  alias: 'database',
  register: async(hook, config, app) => {
    const interface = await DatabaseInterface.boot(hook, config, app)

    await app.blockchainManager.attachDatabaseInterface(interface)
  },
  exports: {
    DatabaseInterface
  }
}
