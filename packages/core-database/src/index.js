const DatabaseInterface = require('./interface')
const logger = require('@arkecosystem/core-pluggy').get('logger')

exports.plugin = {
  pkg: require('../package.json'),
  alias: 'database',
  register: async(hook, config, app) => {
    const interface = await DatabaseInterface.boot(hook, config, app)

    await app.blockchainManager.attachDatabaseInterface(interface)

    return DatabaseInterface.getInstance()
  }
}

exports.DatabaseInterface = DatabaseInterface
