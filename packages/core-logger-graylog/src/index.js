const logger = require('./logger')

exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  init: async (config) => logger.init(config)
}
