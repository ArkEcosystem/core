'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')

/**
 * Start a forger.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  pluginManager.init(options.config, {
    include: [
      '@arkecosystem/core-config',
      '@arkecosystem/core-config-json',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-forger'
    ],
    options: {
      '@arkecosystem/core-blockchain': {
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
  pluginManager.hook('mounted')
}
