'use strict';

const path = require('path')
const pluginManager = require('@arkecosystem/core-plugin-manager')

const config = require('./stubs/config')

const setupPluggy = async () => {
  pluginManager.init('../core-config/src/networks/devnet')

  await pluginManager.hook('init', {
    network: path.resolve(__dirname, '../../core-config/src/networks/devnet')
  })
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')
}

module.exports = async () => {
  await setupPluggy()

  await require('../src/server')(config)
}
