'use strict'

const pluginManager = require('@arkecosystem/core-plugin-manager')

/**
 * Start a relay.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  const config = options.config

  pluginManager.init(options.data, config, {
    exclude: ['@arkecosystem/core-forger'],
    options: {
      '@arkecosystem/core-blockchain': {
        networkStart: options.networkStart
      }
    }
  })

  await pluginManager.hook('init', {config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')
  await pluginManager.get('blockchain').start()

  pluginManager.hook('mounted')
}
