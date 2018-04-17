const manager = require('./manager')

exports.plugin = {
  pkg: require('../package.json'),
  alias: 'config',
  register: async(hook, config, app) => await manager.init(app.network)
}
