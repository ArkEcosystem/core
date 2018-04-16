const package = require('../package.json')
const server = require('./server')

module.exports = {
  name: package.name,
  version: package.version,
  register: async(options) => {
    // logger.info('Initialising Public API...')
    await server()
  }
}
