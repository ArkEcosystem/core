'use strict'

const container = require('@arkecosystem/core-container')

/**
 * Start a relay.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  const config = options.config

  container.init({ data: options.data, config }, {
    exclude: ['@arkecosystem/core-forger'],
    options: {
      '@arkecosystem/core-blockchain': {
        networkStart: options.networkStart
      }
    }
  })

  await container.plugins.registerGroup('init', { config: options.config })
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')
  await container.get('blockchain').start()

  container.plugins.registerGroup('mounted')
}
