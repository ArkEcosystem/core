const DatabaseInterface = require('./interface')

exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  alias: 'database',
  register: async (hook, config, app) => {
    const database = await DatabaseInterface.init()

    await app.blockchainManager.attachDatabaseInterface(database)

    return app.blockchainManager.getDb()
  }
}

exports.DatabaseInterface = DatabaseInterface
