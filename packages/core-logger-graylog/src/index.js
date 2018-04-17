const logger = require('./logger')

exports.plugin = {
  pkg: require('../package.json'),
  init: async(config) => logger.init(config)
}
