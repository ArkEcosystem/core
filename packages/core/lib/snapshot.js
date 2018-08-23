'use strict'

const container = require('@phantomcore/core-container')

/**
 * Create a snapshot.
 * @param  {Object} options
 * @return {void}
 */
module.exports = async (options) => {
  await container.setUp(options, {
    include: [
      '@phantomcore/core-event-emitter',
      '@phantomcore/core-config',
      '@phantomcore/core-logger',
      '@phantomcore/core-logger-winston',
      '@phantomcore/core-database',
      '@phantomcore/core-database-sequelize',
      '@phantomcore/core-blockchain'
    ],
    options: {
      '@phantomcore/core-blockchain': {
        networkStart: options.networkStart
      }
    }
  })

  container.resolvePlugin('database').snapshot()
}
