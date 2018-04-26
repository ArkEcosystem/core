'use strict';

const path = require('path')
const pluginManager = require('@arkecosystem/core-plugin-manager')

const defaults = require('../__stubs__/defaults.json')

const setupPluggy = async () => {
  const config = path.resolve(__dirname, '../../../core-config/lib/networks/devnet')
  pluginManager.init(config)

  await pluginManager.hook('init', {config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')
}

module.exports = async () => {
  await setupPluggy()

  await require('../../lib/server')(defaults)
}
