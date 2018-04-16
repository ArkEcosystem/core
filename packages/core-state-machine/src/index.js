const logger = require('@arkecosystem/core-module-loader').get('logger')
const package = require('../package.json')
const machine = require('./machine')

module.exports = {
  name: package.name,
  version: package.version,
  alias: 'state-machine',
  register: async(hook, config, app) => machine
}
