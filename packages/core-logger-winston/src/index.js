const package = require('../package.json')
const logger = require('./logger')

module.exports = {
  name: package.name,
  version: package.version,
  boot: async(config) => logger.boot(config)
}
