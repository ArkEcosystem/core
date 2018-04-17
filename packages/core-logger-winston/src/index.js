const logger = require('@arkecosystem/core-pluggy').get('logger')
const winston = require('./logger')

exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (hook, config, app) => {
    const instance = await winston.init(config)

    await logger.setDriver(instance)
  },
}
