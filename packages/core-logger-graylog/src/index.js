const logger = require('./logger')

exports.plugin = {
  pkg: require('../package.json'),
  boot: async(config) => logger.boot(config)
}
