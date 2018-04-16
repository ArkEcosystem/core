const package = require('../package.json')
const manager = require('./manager')

module.exports = {
  name: package.name,
  version: package.version,
  alias: 'config',
  register: async(hook, config, app) => await manager.boot(app.network)
}
