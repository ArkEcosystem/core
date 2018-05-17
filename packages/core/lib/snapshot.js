'use strict'

const container = require('@arkecosystem/core-container')

/**
 * Create a snapshot.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  await container.start({
    data: options.data,
    config: options.config
  }, {
    include: [
      '@arkecosystem/core-event-emitter',
      '@arkecosystem/validation',
      '@arkecosystem/core-config',
      '@arkecosystem/core-config',
      '@arkecosystem/core-config-json',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-database',
      '@arkecosystem/core-database-sequelize',
      '@arkecosystem/core-blockchain'
    ],
    options: {
      '@arkecosystem/core-blockchain': {
        networkStart: options.networkStart
      }
    }
  })

  container.resolvePlugin('database').snapshot()
}
