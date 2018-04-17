const DatabaseInterface = require('./interface')

exports.plugin = {
  pkg: require('../package.json'),
  alias: 'database',
  register: async (hook, config, app) => {
    const database = await DatabaseInterface.init(hook, config, app)

    await app.blockchainManager.attachDatabaseInterface(database)

    return DatabaseInterface.getInstance()
  }
}

exports.DatabaseInterface = DatabaseInterface
