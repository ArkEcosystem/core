'use strict'

const container = require('@arkecosystem/core-container')

/**
 * Create a snapshot.
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
      '@arkecosystem/core-blockchain',
      '@arkecosystem/core-database',
      '@arkecosystem/core-database-sequelize'
    ],
    options: {
      '@arkecosystem/core-blockchain': {
        networkStart: options.networkStart
      }
    }
  })

  await container.plugins.registerGroup('init', { config: options.config })
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')

  container.get('database').snapshot()
}
