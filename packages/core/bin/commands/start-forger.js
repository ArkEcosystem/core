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
    include: [
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-pino',
      '@arkecosystem/core-forger'
    ],
    options: {
      '@arkecosystem/core-forger': {
        bip38: options.bip38,
        address: options.address,
        password: options.password
      }
    }
  })

  await pluginManager.hook('init', {network: config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')
  await pluginManager.hook('mounted')
}
