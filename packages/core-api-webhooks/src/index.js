const logger = require('@arkecosystem/core-pluggy').get('logger')
const Server = require('./server')

exports.plugin = {
  pkg: require('../package.json'),
  register: async (hook, config, app) => {
    logger.info('Initialising Webhook API...')

    await Server(config)
  }
}
