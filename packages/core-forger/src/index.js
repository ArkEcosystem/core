const logger = require('@arkecosystem/core-module-loader').get('logger')
const package = require('../package.json')
const ForgerManager = require('./manager')

module.exports = {
  name: package.name,
  version: package.version,
  alias: 'forger',
  register: async(hook, config, app) => {
    const forgerManager = await new ForgerManager(app.config)

    const forgers = await forgerManager.loadDelegates(
      app.credentials.bip38, app.credentials.address, app.credentials.password
    )

    logger.info(`ForgerManager started with ${forgers.length} forgers`)
  }
}
