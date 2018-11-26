const container = require('@arkecosystem/core-container')

exports.setUpLite = async options => {
  process.env.ARK_SKIP_BLOCKCHAIN = true
  await container.setUp('2.0.0', options, {
    include: [
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-event-emitter',
      '@arkecosystem/core-snapshots',
    ],
  })

  return container
}

exports.tearDown = async () => container.tearDown()
