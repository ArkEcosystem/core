'use strict';

const path = require('path')
const pluginManager = require('@arkecosystem/core-plugin-manager')

module.exports = async () => {
  const config = path.resolve(__dirname, '../../core-config/lib/networks/devnet')

  pluginManager.init(config, {
    exclude: [
      '@arkecosystem/core-api-p2p',
      '@arkecosystem/core-transaction-pool-redis'
    ]
  })

  await pluginManager.hook('init', {config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')

  // pluginManager.get('logger').info('Starting Blockchain Manager...')
  // const blockchainManager = pluginManager.get('blockchain')
  // await blockchainManager.start()
  // await blockchainManager.isReady()
}
