'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

const defaults = require('../__stubs__/defaults.json')

module.exports = async () => {
  const config = path.resolve(__dirname, '../../../core-config/lib/networks/testnet')
  container.init({ data: '~/.ark', config })

  await container.plugins.registerGroup('init', {config})
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')

  await container.plugins.register('@arkecosystem/core-webhooks')

  await require('../../lib/server')(defaults)
}
