'use strict'

const pluginManager = require('@arkecosystem/core-plugin-manager')

/**
 * Start a node.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  const config = options.config

  pluginManager.init(options.data, config, {
    options: {
      '@arkecosystem/core-api-p2p': {
        networkStart: options.networkStart
      },
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

  await pluginManager.hook('init', {config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')
  await pluginManager.get('blockchain').start()

  pluginManager.hook('mounted')
}
