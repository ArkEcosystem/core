'use strict';

const path = require('path')
const pluginManager = require('@arkecosystem/core-plugin-manager')

module.exports = async () => {
  pluginManager.init('../core-config/src/networks/devnet')

  await pluginManager.hook('init', {
    network: path.resolve(__dirname, '../../core-config/src/networks/devnet')
  })

  await pluginManager.hook('beforeCreate')

  await pluginManager.hook('beforeMount')

  pluginManager.get('logger').info('Starting Blockchain Manager...')
  const blockchainManager = pluginManager.get('blockchain')
  await blockchainManager.start()
  await blockchainManager.isReady()
}
