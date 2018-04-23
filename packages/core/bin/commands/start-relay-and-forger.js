'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')

/**
 * [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
module.exports = async (options) => {
  pluginManager.init(options.config, {
    options: {
      '@arkecosystem/core-api-p2p': {
        networkStart: options.networkStart
      },
      '@arkecosystem/core-forger': {
        bip38: options.bip38,
        address: options.address,
        password: options.password
      }
    }
  })

  await pluginManager.hook('init', { config: options.config })
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')

  pluginManager.get('logger').info('Starting Blockchain Manager...')
  const blockchainManager = pluginManager.get('blockchain')
  await blockchainManager.start()
  await blockchainManager.isReady()

  await pluginManager.hook('mounted')
}
