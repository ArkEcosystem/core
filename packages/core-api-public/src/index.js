const logger = require('@arkecosystem/core-module-loader').get('logger')
const Server = require('./server')

exports.plugin = {
  pkg: require('../package.json'),
  register: async(hook, config, app) => {
    logger.info('Initialising Public API...')

    await Server(config)
  }
}
