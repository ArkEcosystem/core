'use strict'

const container = require('@arkecosystem/core-container')

/**
 * Create a snapshot.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  await container.setUp(options, {
    include: [
      '@arkecosystem/core-event-emitter',
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-database',
      '@arkecosystem/core-database-postgres',
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
