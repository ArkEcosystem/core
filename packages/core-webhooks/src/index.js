const logger = require('@arkecosystem/core-pluggy').get('logger')
const Manager = require('./manager')
const Server = require('./api/server')

exports.plugin = {
  pkg: require('../package.json'),
  alias: 'webhooks',
  register: async(hook, config, app) => {
    logger.info('Initialising Webhook Manager...')

    const manager = new Manager(config)
    await manager.boot(config)

    logger.info('Initialising Webhook API...')
    await Server(config)

    return Manager.getInstance()
  }
}
