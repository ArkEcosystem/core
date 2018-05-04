'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

const defaults = require('../__stubs__/defaults.json')

const setupPluggy = async () => {
  const config = path.resolve(__dirname, '../../../core-config/lib/networks/testnet')
  container.init({ data: '~/.ark', config })

  await container.plugins.registerGroup('init', {config})
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')
}

module.exports = async () => {
  await setupPluggy()

  await require('../../lib/server')(defaults)
}
