const package = require('../package.json')
const logger = require('./logger')

module.exports = {
  name: package.name,
  version: package.version,
  alias: 'logger',
  register: async(hook, config, app) => logger.boot(hook, config.driver, app)
}
