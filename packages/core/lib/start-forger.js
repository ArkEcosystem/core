'use strict'

const container = require('@arkecosystem/core-container')

/**
 * Start a forger.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  const config = options.config

  container.init({ data: options.data, config }, {
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

  await container.plugins.registerGroup('init', { config: options.config })
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')

  container.plugins.registerGroup('mounted')
}
