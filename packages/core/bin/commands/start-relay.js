'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')

/**
 * [description]
 * @param  {[type]} config  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
module.exports = async (config, options) => {
  pluginManager.init(config)

  await pluginManager.hook('init', {network: config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')

  pluginManager.get('logger').info('Starting Blockchain Manager...')
  const blockchainManager = pluginManager.get('blockchain')
  await blockchainManager.start()
  await blockchainManager.isReady()

  await pluginManager.hook('mounted')
}
