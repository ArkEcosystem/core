'use strict'

const container = require('@arkecosystem/core-container')

exports.setUp = async (options) => {
  await container.setUp(options, {
    include: [
      '@arkecosystem/core-storage',
      '@arkecosystem/core-event-emitter',
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-database',
      '@arkecosystem/core-database-postgres'
          ]
  })

  return container
}

exports.tearDown = async () => container.tearDown()
