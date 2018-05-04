'use strict'

const container = require('@arkecosystem/core-container')

/**
 * Start a node.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  const config = options.config

  container.init({ data: options.data, config }, {
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

  await container.plugins.registerGroup('init', { config: options.config })
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')
  await container.get('blockchain').start()

  container.plugins.registerGroup('mounted')
}
