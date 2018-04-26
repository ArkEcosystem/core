'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')

/**
 * Start a relay.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  pluginManager.init(options.config, {
    exclude: ['@arkecosystem/core-forger']
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
