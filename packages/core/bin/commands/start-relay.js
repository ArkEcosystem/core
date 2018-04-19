'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')

/**
 * [description]
 * @param  {[type]} config  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
module.exports = async (config, options) => {
  pluginManager.init(config, {
    exclude: ['@arkecosystem/core-forger'],
    options: {
      '@arkecosystem/core-api-p2p': {
        networkStart: options.networkStart
      }
    }
  })

  await pluginManager.hook('init', {network: config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')

  /**
   * TODO:
   *   1. refactor this process into a module
   * OR
   *   2. add the ability to specify custom methods that are called after the plugin mount
   */
  pluginManager.get('logger').info('Starting Blockchain Manager...')
  const blockchainManager = pluginManager.get('blockchain')
  await blockchainManager.start()
  await blockchainManager.isReady()

  await pluginManager.hook('mounted')
}
