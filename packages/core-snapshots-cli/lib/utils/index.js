const app = require('@phantomchain/core-container')

exports.setUpLite = async options => {
  process.env.PHANTOM_SKIP_BLOCKCHAIN = true
  await app.setUp('2.0.0', options, {
    include: [
      '@phantomchain/core-config',
      '@phantomchain/core-logger',
      '@phantomchain/core-logger-winston',
      '@phantomchain/core-event-emitter',
      '@phantomchain/core-snapshots',
    ],
  })

  return app
}

exports.tearDown = async () => app.tearDown()
