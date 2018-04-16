const package = require('../package.json')
const manager = require('./manager')

module.exports = {
  name: package.name,
  version: package.version,
  alias: 'webhooks',
  register: async(hook, config, app) => {
    console.log(hook, config, app)
    process.exit()
    await manager.boot(hook, config, app)
  }
}
