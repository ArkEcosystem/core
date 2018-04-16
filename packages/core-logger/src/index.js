const logger = require('./logger')

exports.plugin = {
  pkg: require('../package.json'),
  alias: 'logger',
  register: async(hook, config, app) => logger.boot(hook, config.driver, app)
}
