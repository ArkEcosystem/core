'use strict'

const container = require('@arkecosystem/core-container')

exports.setUpNormal = async (options) => {
  process.env.ARK_SKIP_BLOCKCHAIN = true
  await container.setUp(options, {
    include: [
      '@arkecosystem/core-storage',
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
        networkStart: false
      }
    }
  })

  return container
}

exports.setUpConfigOnly = async (options) => {
  process.env.ARK_SKIP_BLOCKCHAIN = true
  await container.setUp(options, {
    include: [
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston'
    ]
  })

  return container
}

exports.tearDown = async () => container.tearDown()
